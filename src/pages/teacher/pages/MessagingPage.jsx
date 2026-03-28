import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Popover
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  EmojiEmotions as MoodIcon
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
  serverTimestamp,
  limit,
  setDoc,
  deleteField
} from 'firebase/firestore';
import { db, storage } from '../../../config/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { handleBackNavigation } from '../../../utils/navigation';
import { sendNotificationToTeachers, requestNotificationPermission, showAppNotification, notifyError } from '../../../services/notificationService';
import EmojiPicker from 'emoji-picker-react';

const GLOBAL_CHAT_ID = 'chat_global_room';

// Memoized Message Component for better performance
const MessageItem = React.memo(({ message, isOwnMessage, formatMessageDate, renderDateSeparator, prevMsg, handleMenuOpen }) => {
  return (
    <React.Fragment>
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
            {message.senderName?.[0]?.toUpperCase() || '?'}
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
            '&:hover .menu-btn': { opacity: 1 }
          }}
        >
          {!isOwnMessage && (
            <Typography variant="caption" sx={{ color: '#075E54', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              {message.senderName || 'Anonymous'}
            </Typography>
          )}
          
          {message.content && (
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
          )}
          {message.imageUrl && (
            <Box sx={{ mt: 1 }}>
              <Box
                component="img"
                src={message.imageUrl}
                alt="shared"
                sx={{
                  maxWidth: 260,
                  width: '100%',
                  borderRadius: 2,
                  cursor: 'pointer'
                }}
                onClick={() => window.open(message.imageUrl, '_blank', 'noopener,noreferrer')}
              />
            </Box>
          )}
          {message.audioUrl && (
            <Box sx={{ mt: 1, minWidth: { xs: 200, sm: 250 } }}>
               <audio controls src={message.audioUrl} style={{ width: '100%', height: 40, outline: 'none' }} />
            </Box>
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

          {isOwnMessage && (
            <IconButton
              className="menu-btn"
              size="small"
              onClick={(e) => handleMenuOpen(e, message)}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                opacity: 0,
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
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isEdited === nextProps.message.isEdited &&
    prevProps.isOwnMessage === nextProps.isOwnMessage
  );
});

MessageItem.displayName = 'MessageItem';

const MessagingPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // New features state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const seenMessageIdsRef = useRef(new Set());
  const isPageFocusedRef = useRef(true);
  
  // New features refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputContainerRef = useRef(null);
  const isRecordingRef = useRef(false);
  
  // Track page focus state
  useEffect(() => {
    const handleFocus = () => {
      isPageFocusedRef.current = true;
    };
    const handleBlur = () => {
      isPageFocusedRef.current = false;
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Listen for new messages and show notifications (if not from current user)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(1)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const message = change.doc.data();
            const messageId = change.doc.id;
            
            // Avoid duplicate notifications
            if (seenMessageIdsRef.current.has(messageId)) return;
            seenMessageIdsRef.current.add(messageId);
            
            // Only show notification if message is from someone else and page is not focused
            if (message.senderId !== currentUser.uid && message.content && !isPageFocusedRef.current) {
              showAppNotification(
                `New message from ${message.senderName || 'Someone'}`,
                message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
                { tag: `chat-${messageId}`, data: { url: '/teacher/messaging' } }
              );
            }
          }
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to Typing Status
  useEffect(() => {
    if (!currentUser) return;
    const typingRef = doc(db, 'chats', GLOBAL_CHAT_ID, 'status', 'typing');
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
       if (snapshot.exists()) {
          const data = snapshot.data();
          // Filter out current user's typing status
          const othersTyping = Object.entries(data).filter(([uid]) => uid !== currentUser.uid);
          setTypingUsers(Object.fromEntries(othersTyping));
       } else {
          setTypingUsers({});
       }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Optimized: Limit to last 100 messages and order by timestamp desc for better performance
  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Reverse to show oldest first
      setMessages(msgs.reverse());
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Memoize scroll to bottom to avoid unnecessary re-renders
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing input synchronization
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    
    if (!currentUser) return;
    const typingRef = doc(db, 'chats', GLOBAL_CHAT_ID, 'status', 'typing');
    
    // Update only once per burst to prevent Firebase spam crashing regular messages
    if (!typingTimeoutRef.current) {
        setDoc(typingRef, { [currentUser.uid]: currentUser.name || 'Someone' }, { merge: true })
          .catch(console.error);
    }

    // Clear timeout if exists, set new one for 2 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
       updateDoc(typingRef, { [currentUser.uid]: deleteField() }).catch(console.error);
       typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageText((prev) => prev + emojiObject.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = { mimeType: 'audio/webm' };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
         options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 16000 };
      }
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.onloadend = async () => {
           try {
             const senderName = currentUser?.name || 'Anonymous';
             await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
               senderId: currentUser.uid,
               senderName: senderName,
               content: '',
               imageUrl: '',
               audioUrl: reader.result,
               type: 'audio',
               timestamp: serverTimestamp(),
               isEdited: false
           });
             sendNotificationToTeachers(senderName, "Sent a voice message").catch(console.error);
           } catch (error) {
             console.error("Voice message error", error);
             notifyError("Send Failed", "Could not send voice message.");
           }
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
           if (prev >= 59) {
             stopRecording();
             return 60;
           }
           return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      notifyError("Microphone Error", "Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // triggers onstop which sends the message
      setIsRecording(false);
      // Let onstop reset isRecordingRef.current otherwise it aborts saving
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
       setIsRecording(false);
       isRecordingRef.current = false;
       clearInterval(recordingTimerRef.current);
       // Overwrite onstop so it does not trigger the send
       mediaRecorderRef.current.onstop = null;
       const stream = mediaRecorderRef.current.stream;
       stream.getTracks().forEach(t => t.stop());
       mediaRecorderRef.current.stop();
     }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !editingMessage && !selectedImageFile) || !currentUser) return;

    const messageContent = messageText.trim();
    const senderName = currentUser.name || 'Anonymous';

    try {
      if (editingMessage) {
        await updateDoc(
          doc(db, 'chats', GLOBAL_CHAT_ID, 'messages', editingMessage.id),
          {
            content: messageContent,
            isEdited: true
          }
        );
        setEditingMessage(null);
      } else {
        let imageUrl = '';
        if (selectedImageFile) {
          setUploadingImage(true);
          try {
            // Bypass Firebase Storage completely using local Base64 conversion
            // This guarantees images will send even if Storage rules are broken
            imageUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(selectedImageFile);
            });
          } catch (uploadError) {
            console.error('Image processing failed completely:', uploadError);
            setUploadingImage(false);
            notifyError('Upload failed', 'Failed to process image.');
            return; // Abort send if image failed
          }
        }

        await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
          senderId: currentUser.uid,
          senderName: senderName,
          content: messageContent,
          imageUrl: imageUrl || '',
          type: 'text',
          timestamp: serverTimestamp(),
          isEdited: false
        });
        
        // Send notifications to all teachers (async, don't wait)
        if (messageContent) {
           sendNotificationToTeachers(senderName, messageContent).catch(err => {
             console.error('Error sending notification:', err);
           });
        } else if (imageUrl) {
           sendNotificationToTeachers(senderName, "Sent an image").catch(console.error);
        }
      }
      setMessageText('');
      setSelectedImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      notifyError('Send failed', error.message || 'Failed to send message. Please try again.');
    } finally {
      setUploadingImage(false);
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

  // Memoized date formatter
  const formatMessageDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  }, []);

  // Memoized date separator renderer
  const renderDateSeparator = useCallback((currentMsg, prevMsg) => {
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
  }, []);


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
      <AppBar position="static" elevation={2} sx={{ bgcolor: '#075E54', zIndex: 10 }}>
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Avatar sx={{ mr: 2, bgcolor: '#25D366', width: 40, height: 40, fontWeight: 'bold' }}>P</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              Pillars of Sunday School
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#25D366' }}></span>
              {messages.length === 0 ? 'Start the conversation' : `${messages.length} messages`}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 2. Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: { xs: 1.5, sm: 2 },
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // Subtle chat pattern
          backgroundRepeat: 'repeat',
          backgroundSize: '400px'
        }}
      >
        {messages.length === 0 ? null : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser?.uid;
            const prevMsg = index > 0 ? messages[index - 1] : null;

            return (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                formatMessageDate={formatMessageDate}
                renderDateSeparator={renderDateSeparator}
                prevMsg={prevMsg}
                handleMenuOpen={handleMenuOpen}
              />
            );
          })
        )}
        {Object.keys(typingUsers).length > 0 && (
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 1 }}>
              <Paper elevation={1} sx={{ px: 2, py: 1, borderRadius: 3, bgcolor: '#ffffff', display: 'flex', alignItems: 'center' }}>
                 <Typography variant="body2" sx={{ color: '#00a884', fontStyle: 'italic', fontWeight: 500 }}>
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                 </Typography>
              </Paper>
           </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* 3. Input Area */}
      <Box 
        sx={{ 
          p: 1.5, 
          bgcolor: '#f0f0f0', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Edit Mode & File Preview Container above input */}
        {(editingMessage || selectedImageFile) && (
          <Fade in={true}>
            <Box 
                sx={{ 
                    bgcolor: 'white', 
                    p: 1.5, 
                    mb: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderLeft: `4px solid ${editingMessage ? '#00a884' : '#1976d2'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                }}
            >
                {editingMessage ? (
                   <>
                     <EditIcon sx={{ color: '#00a884' }} />
                     <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                         <Typography variant="caption" sx={{ color: '#00a884', fontWeight: 'bold' }}>Editing Message</Typography>
                         <Typography variant="body2" color="text.secondary" noWrap sx={{ fontStyle: 'italic' }}>{editingMessage.content}</Typography>
                     </Box>
                     <IconButton size="small" onClick={handleCancelEdit} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                         <CloseIcon fontSize="small" />
                     </IconButton>
                   </>
                ) : selectedImageFile ? (
                   <>
                     <ImageIcon sx={{ color: '#1976d2' }} />
                     <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                         <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Attached Image</Typography>
                         <Typography variant="body2" color="text.secondary" noWrap>{selectedImageFile.name}</Typography>
                     </Box>
                     <IconButton
                       size="small"
                       onClick={() => {
                         setSelectedImageFile(null);
                         if (fileInputRef.current) fileInputRef.current.value = '';
                       }}
                       sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}
                     >
                       <CloseIcon fontSize="small" />
                     </IconButton>
                   </>
                ) : null}
            </Box>
          </Fade>
        )}

        {/* Emoji Content Popover */}
        <Popover
          open={showEmojiPicker}
          anchorEl={inputContainerRef.current}
          onClose={() => setShowEmojiPicker(false)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: { borderRadius: 3, mb: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
          }}
        >
          <EmojiPicker onEmojiClick={(emojiObj) => {
             handleEmojiClick(emojiObj);
          }} width={320} height={400} />
        </Popover>

        {/* WhatsApp-style Input Bar */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setSelectedImageFile(f);
            }}
          />

          <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center' }} ref={inputContainerRef}>
             <IconButton
               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
               disabled={isRecording}
               sx={{ position: 'absolute', left: 8, bottom: 4, color: showEmojiPicker ? '#00a884' : '#8696a0', zIndex: 1 }}
               aria-label="Emoji"
             >
               <MoodIcon />
             </IconButton>
             <TextField
               fullWidth
               disabled={isRecording}
               placeholder={isRecording ? "Recording..." : "Type a message"}
               variant="outlined"
               multiline
               maxRows={4}
               value={messageText}
               onChange={handleTyping}
               onKeyPress={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
               sx={{
                 bgcolor: 'white',
                 borderRadius: '24px',
                 '& .MuiOutlinedInput-root': {
                   borderRadius: '24px',
                   py: 1.5,
                   pl: 6, // Make room for emoji icon
                   pr: 6, // Make room for attach icon
                   '& fieldset': {
                     border: 'none',
                   }
                 }
               }}
             />
             <IconButton
               onClick={() => fileInputRef.current?.click()}
               disabled={uploadingImage || isRecording}
               sx={{ position: 'absolute', right: 8, bottom: 4, color: '#8696a0', zIndex: 1 }}
               aria-label="Attach image"
             >
               <ImageIcon />
             </IconButton>
          </Box>

          {(messageText.trim() || editingMessage || selectedImageFile) ? (
             <IconButton
               onClick={handleSend}
               disabled={uploadingImage || isRecording}
               sx={{
                 bgcolor: '#00a884',
                 color: 'white',
                 width: 50,
                 height: 50,
                 mb: 0.5,
                 flexShrink: 0,
                 '&:hover': { bgcolor: '#008f6f' },
                 transition: 'background-color 0.2s',
                 boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
               }}
             >
               {editingMessage ? <EditIcon /> : <SendIcon sx={{ ml: 0.5 }} />}
             </IconButton>
          ) : isRecording ? (
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" color="error" sx={{ fontWeight: 'bold', minWidth: 40, textAlign: 'center' }}>
                   {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </Typography>
                <IconButton onClick={cancelRecording} sx={{ color: 'error.main', width: 40, height: 40 }}>
                   <DeleteIcon />
                </IconButton>
                <IconButton onClick={stopRecording} sx={{ bgcolor: '#00a884', color: 'white', width: 50, height: 50, flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#008f6f' } }}>
                   <SendIcon sx={{ ml: 0.5 }} />
                </IconButton>
             </Box>
          ) : (
             <IconButton
               onClick={startRecording}
               disabled={uploadingImage}
               sx={{
                 bgcolor: '#00a884',
                 color: 'white',
                 width: 50,
                 height: 50,
                 mb: 0.5,
                 flexShrink: 0,
                 '&:hover': { bgcolor: '#008f6f' },
                 transition: 'background-color 0.2s',
                 boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
               }}
             >
               <MicIcon />
             </IconButton>
          )}
        </Box>
      </Box>

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