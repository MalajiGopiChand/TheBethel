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
  Fade
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon
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
  limit
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { handleBackNavigation } from '../../../utils/navigation';
import { sendNotificationToTeachers, requestNotificationPermission } from '../../../services/notificationService';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const seenMessageIdsRef = useRef(new Set());
  const isPageFocusedRef = useRef(true);
  
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
              // Show notification (works even when page is in background)
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(`New message from ${message.senderName || 'Someone'}`, {
                  body: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
                  icon: '/icon-192x192.png',
                  badge: '/icon-192x192.png',
                  tag: `chat-${messageId}`,
                  requireInteraction: false,
                  silent: false
                });
                
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
                
                // Auto close after 5 seconds
                setTimeout(() => {
                  notification.close();
                }, 5000);
              }
            }
          }
        });
      }
    );

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



  const handleSend = async () => {
    if ((!messageText.trim() && !editingMessage) || !currentUser) return;

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
        await addDoc(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), {
          senderId: currentUser.uid,
          senderName: senderName,
          content: messageContent,
          type: 'text',
          timestamp: serverTimestamp(),
          isEdited: false
        });
        
        // Send notifications to all teachers (async, don't wait)
        sendNotificationToTeachers(senderName, messageContent).catch(err => {
          console.error('Error sending notification:', err);
        });
      }
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
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
      <AppBar position="static" sx={{ bgcolor: '#075E54' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
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
                    <BackIcon />
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
          disabled={!messageText.trim() && !editingMessage}
          sx={{
            bgcolor: messageText.trim() || editingMessage ? '#075E54' : 'grey.300',
            color: 'white',
            width: 45,
            height: 45,
            '&:hover': { bgcolor: (messageText.trim() || editingMessage) ? '#128C7E' : undefined },
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