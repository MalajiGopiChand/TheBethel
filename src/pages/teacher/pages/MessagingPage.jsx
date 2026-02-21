import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  CircularProgress,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  Fade,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const GLOBAL_CHAT_ID = 'chat_global_room';

// Voice Message Player Component
const VoiceMessagePlayer = ({ audioUrl, messageId, isOwnMessage, playingAudioId, setPlayingAudioId, audioRefs }) => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRefs.current[messageId]) {
      audioRefs.current[messageId] = audioRef.current;
    }
    
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayingAudioId(null);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setPlayingAudioId(messageId);
      // Pause other audio players
      Object.keys(audioRefs.current).forEach(id => {
        if (id !== messageId && audioRefs.current[id]) {
          audioRefs.current[id].pause();
        }
      });
    };
    const handlePause = () => {
      setIsPlaying(false);
      if (playingAudioId === messageId) {
        setPlayingAudioId(null);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [messageId, playingAudioId, setPlayingAudioId, audioRefs]);

  useEffect(() => {
    if (playingAudioId !== messageId && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [playingAudioId, messageId, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box sx={{ 
      mb: 1, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      minWidth: 200,
      maxWidth: 300
    }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <IconButton
        onClick={togglePlay}
        size="small"
        sx={{
          bgcolor: isOwnMessage ? '#075E54' : '#25D366',
          color: 'white',
          width: 36,
          height: 36,
          '&:hover': { bgcolor: isOwnMessage ? '#128C7E' : '#20BA5A' }
        }}
      >
        {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ 
          height: 4, 
          bgcolor: 'rgba(0,0,0,0.1)', 
          borderRadius: 2, 
          overflow: 'hidden',
          mb: 0.5
        }}>
          <Box sx={{ 
            height: '100%', 
            bgcolor: isOwnMessage ? '#075E54' : '#25D366',
            width: `${progress}%`,
            transition: 'width 0.1s linear'
          }} />
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
};

const MessagingPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioRefs = useRef({});

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Compress image before upload
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(resolve, 'image/jpeg', quality);
        };
      };
    });
  };

  const handleImageSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview({
        file: file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imagePreview || !currentUser) return;
    
    setUploadingImage(true);
    try {
      // Compress image
      const compressedFile = await compressImage(imagePreview.file);
      
      const imageRef = ref(storage, `chat_images/${Date.now()}_${imagePreview.file.name}`);
      await uploadBytes(imageRef, compressedFile);
      const imageUrl = await getDownloadURL(imageRef);
      
      await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.name || 'Anonymous',
        content: '',
        imageUrl: imageUrl,
        type: 'image',
        timestamp: serverTimestamp(),
        isEdited: false
      });
      
      setImagePreview(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelImagePreview = () => {
    setImagePreview(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use mimeType that's widely supported
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/ogg';
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size > 0) {
          await uploadAudioMessage(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.onerror = (e) => {
        console.error('Recording error:', e);
        alert('Error recording audio. Please try again.');
        stopRecording();
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setRecording(true);
      setAudioChunks(chunks);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadAudioMessage = async (audioBlob) => {
    if (!audioBlob || !currentUser) return;
    
    setUploadingAudio(true);
    try {
      const audioRef = ref(storage, `chat_audio/${Date.now()}_${currentUser.uid}.webm`);
      await uploadBytes(audioRef, audioBlob);
      const audioUrl = await getDownloadURL(audioRef);
      
      await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.name || 'Anonymous',
        content: '',
        audioUrl: audioUrl,
        type: 'audio',
        timestamp: serverTimestamp(),
        isEdited: false
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload voice message. Please try again.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !editingMessage) || !currentUser) return;

    try {
      if (editingMessage) {
        await updateDoc(
          doc(db, 'chats', GLOBAL_CHAT_ID, 'messages', editingMessage.id),
          {
            content: messageText.trim(),
            isEdited: true
          }
        );
        setEditingMessage(null);
      } else {
        await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
          senderId: currentUser.uid,
          senderName: currentUser.name || 'Anonymous',
          content: messageText.trim(),
          type: 'text',
          timestamp: serverTimestamp(),
          isEdited: false
        });
      }
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setMessageText(message.content);
    setAnchorEl(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageText('');
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'chats', GLOBAL_CHAT_ID, 'messages', messageId));
      setAnchorEl(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleMenuOpen = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  // Helper to render date separators
  const renderDateSeparator = (currentMsg, prevMsg) => {
    if (!currentMsg.timestamp) return null;
    const currDate = currentMsg.timestamp.toDate ? currentMsg.timestamp.toDate() : new Date(currentMsg.timestamp);
    const prevDate = prevMsg?.timestamp ? (prevMsg.timestamp.toDate ? prevMsg.timestamp.toDate() : new Date(prevMsg.timestamp)) : null;

    if (!prevDate || !isSameDay(currDate, prevDate)) {
      let label = format(currDate, 'MMMM d, yyyy');
      if (isToday(currDate)) label = 'Today';
      if (isYesterday(currDate)) label = 'Yesterday';

      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Paper sx={{ px: 2, py: 0.5, bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 4, color: 'text.secondary', fontSize: '0.75rem' }}>
            {label}
          </Paper>
        </Box>
      );
    }
    return null;
  };


  // Redirect if not teacher or admin
  useEffect(() => {
    if (!authLoading && currentUser) {
      const isTeacher = currentUser.role === UserRole.TEACHER;
      const isAdmin = currentUser.role === UserRole.ADMIN || 
        currentUser.email === 'gop1@gmail.com' || 
        currentUser.email === 'premkumartenali@gmail.com';
      
      if (!isTeacher && !isAdmin) {
        navigate('/', { replace: true });
      }
    } else if (!authLoading && !currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Don't render if not authorized
  const isTeacher = currentUser?.role === UserRole.TEACHER;
  const isAdmin = currentUser?.role === UserRole.ADMIN || 
    currentUser?.email === 'gop1@gmail.com' || 
    currentUser?.email === 'premkumartenali@gmail.com';
  
  if (!isTeacher && !isAdmin) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#e5ddd5' }}>
      
      {/* 1. Header */}
      <AppBar position="static" sx={{ bgcolor: '#075E54' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Avatar sx={{ mr: 2, bgcolor: '#25D366' }}>B</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              Bethel Chat Room
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {messages.length} messages
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 2. Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // Subtle chat pattern
          backgroundRepeat: 'repeat',
          backgroundSize: '400px'
        }}
      >
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUser?.uid;
          const prevMsg = index > 0 ? messages[index - 1] : null;

          return (
            <React.Fragment key={message.id}>
              {renderDateSeparator(message, prevMsg)}
              
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                {!isOwnMessage && (
                  <Avatar sx={{ width: 30, height: 30, mr: 1, mt: 0.5, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                    {message.senderName[0]}
                  </Avatar>
                )}

                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    px: 2,
                    maxWidth: '75%',
                    borderRadius: 2,
                    borderTopRightRadius: isOwnMessage ? 0 : 2,
                    borderTopLeftRadius: !isOwnMessage ? 0 : 2,
                    bgcolor: isOwnMessage ? '#dcf8c6' : '#ffffff',
                    position: 'relative',
                    '&:hover .menu-btn': { opacity: 1 } // Show menu button on hover
                  }}
                >
                  {!isOwnMessage && (
                    <Typography variant="caption" sx={{ color: '#075E54', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                      {message.senderName}
                    </Typography>
                  )}
                  
                  {message.type === 'image' && message.imageUrl && (
                    <Box 
                      sx={{ 
                        mb: 1, 
                        borderRadius: 2, 
                        overflow: 'hidden', 
                        maxWidth: '100%',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.9 }
                      }}
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    >
                      <img 
                        src={message.imageUrl} 
                        alt="Shared image" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto', 
                          display: 'block',
                          borderRadius: '8px'
                        }} 
                      />
                    </Box>
                  )}
                  
                  {message.type === 'audio' && message.audioUrl && (
                    <VoiceMessagePlayer 
                      audioUrl={message.audioUrl}
                      messageId={message.id}
                      isOwnMessage={isOwnMessage}
                      playingAudioId={playingAudioId}
                      setPlayingAudioId={setPlayingAudioId}
                      audioRefs={audioRefs}
                    />
                  )}
                  
                  {message.content && (
                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                      {message.content}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    {message.isEdited && (
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontStyle: 'italic' }}>
                        Edited
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {formatMessageDate(message.timestamp)}
                    </Typography>
                  </Box>

                  {/* Context Menu Button (Hidden by default) */}
                  {isOwnMessage && (
                    <IconButton
                      className="menu-btn"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, message)}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        opacity: 0, // Hidden until hover
                        transition: 'opacity 0.2s',
                        padding: 0.5,
                        bgcolor: 'rgba(255,255,255,0.5)'
                      }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
              </Box>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* 3. Input Area */}
      <Paper 
        elevation={4} 
        sx={{ 
          p: 2, 
          bgcolor: '#f0f0f0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          position: 'relative'
        }}
      >
        {/* Edit Mode Indicator */}
        {editingMessage && (
          <Fade in={true}>
            <Box 
                sx={{ 
                    position: 'absolute', 
                    bottom: 80, 
                    left: 10, 
                    right: 10, 
                    bgcolor: 'white', 
                    p: 1, 
                    borderRadius: 2,
                    boxShadow: 3,
                    borderLeft: '4px solid #075E54',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 10
                }}
            >
                <EditIcon color="primary" sx={{ mr: 1 }} />
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" color="primary" fontWeight="bold">Editing Message</Typography>
                    <Typography variant="body2" noWrap>{editingMessage.content}</Typography>
                </Box>
                <IconButton size="small" onClick={handleCancelEdit}>
                    <CloseIcon />
                </IconButton>
            </Box>
          </Fade>
        )}

        {/* Image Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleImageSelect(file);
            }
            e.target.value = ''; // Reset input
          }}
        />
        
        <Tooltip title="Upload Image">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || recording || uploadingAudio}
            sx={{
              bgcolor: 'white',
              color: '#075E54',
              '&:hover': { bgcolor: '#e0e0e0' }
            }}
          >
            {uploadingImage ? <CircularProgress size={20} /> : <ImageIcon />}
          </IconButton>
        </Tooltip>

        {/* Recording Indicator */}
        {recording && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            bgcolor: '#f44336', 
            color: 'white', 
            px: 2, 
            py: 1, 
            borderRadius: 3,
            animation: 'pulse 1.5s infinite'
          }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              bgcolor: 'white',
              animation: 'pulse 1s infinite'
            }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 40 }}>
              {formatRecordingTime(recordingTime)}
            </Typography>
            <IconButton
              size="small"
              onClick={stopRecording}
              sx={{ color: 'white', ml: 1 }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={cancelRecording}
              sx={{ color: 'white' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Voice Recording Button */}
        {!recording && (
          <Tooltip title="Record Voice Message">
            <IconButton
              onClick={startRecording}
              disabled={uploadingImage || uploadingAudio || !!imagePreview}
              sx={{
                bgcolor: 'white',
                color: '#075E54',
                '&:hover': { bgcolor: '#e0e0e0' }
              }}
            >
              {uploadingAudio ? <CircularProgress size={20} /> : <MicIcon />}
            </IconButton>
          </Tooltip>
        )}

        {!imagePreview && (
          <TextField
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            multiline
            maxRows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={recording || uploadingImage || uploadingAudio}
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          />
        )}

        {/* Image Preview */}
        {imagePreview && (
          <Box sx={{ 
            position: 'relative', 
            maxWidth: 200, 
            borderRadius: 2, 
            overflow: 'hidden',
            border: '2px solid #075E54'
          }}>
            <img 
              src={imagePreview.preview} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                display: 'block' 
              }} 
            />
            <IconButton
              size="small"
              onClick={cancelImagePreview}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            {uploadingImage && (
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <Typography variant="caption">Uploading...</Typography>
              </Box>
            )}
          </Box>
        )}

        {imagePreview && !uploadingImage && (
          <IconButton
            onClick={handleImageUpload}
            sx={{
              bgcolor: '#075E54',
              color: 'white',
              width: 45,
              height: 45,
              '&:hover': { bgcolor: '#128C7E' }
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        )}

        {!imagePreview && (
          <IconButton
            onClick={handleSend}
            disabled={!messageText.trim() || recording || uploadingImage || uploadingAudio}
            sx={{
              bgcolor: messageText.trim() && !recording && !uploadingImage && !uploadingAudio ? '#075E54' : 'grey.300',
              color: 'white',
              width: 45,
              height: 45,
              '&:hover': { bgcolor: messageText.trim() ? '#128C7E' : undefined },
              transition: 'all 0.2s'
            }}
          >
            {editingMessage ? <EditIcon fontSize="small" /> : <SendIcon fontSize="small" />}
          </IconButton>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 120 }
        }}
      >
        <MenuItem onClick={() => handleEdit(selectedMessage)}>
          <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedMessage?.id)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessagingPage;