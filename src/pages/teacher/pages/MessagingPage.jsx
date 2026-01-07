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
  Close as CloseIcon
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
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';

const GLOBAL_CHAT_ID = 'chat_global_room';

const MessagingPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);

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

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser) return;

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

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#e5ddd5' }}>
      
      {/* 1. Header */}
      <AppBar position="static" sx={{ bgcolor: '#075E54' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/teacher/dashboard')} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Avatar sx={{ mr: 2, bgcolor: '#25D366' }}>G</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              Global Chat
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
                  
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {message.content}
                  </Typography>

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
          gap: 1 
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
                    alignItems: 'center'
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
          sx={{
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!messageText.trim()}
          sx={{
            bgcolor: messageText.trim() ? '#075E54' : 'grey.300',
            color: 'white',
            width: 45,
            height: 45,
            '&:hover': { bgcolor: '#128C7E' },
            transition: 'all 0.2s'
          }}
        >
          {editingMessage ? <EditIcon fontSize="small" /> : <SendIcon fontSize="small" />}
        </IconButton>
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