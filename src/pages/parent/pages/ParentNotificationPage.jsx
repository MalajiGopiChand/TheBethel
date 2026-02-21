import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Avatar,
  IconButton,
  Paper,
  Divider,
  Fade,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  NotificationsActive as BellIcon,
  PriorityHigh as PriorityIcon,
  EventNote as DateIcon,
  Campaign as MegaphoneIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { db } from '../../../config/firebase';
import { handleBackNavigation } from '../../../utils/navigation';

const ParentNotificationPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. QUERY UPDATE: Changed 'createdAt' to 'date' to match Android App
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('date', 'desc'), // <--- This matches your Android/Admin code
      limit(50)
    );
    
    // 2. Listener
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const loadedNotifications = [];
      
      if (snapshot.empty) {
        console.log("No notifications found in 'notifications' collection.");
      }

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const audience = data.audience || 'All';

        // 3. Filter
        if (audience === 'Parents' || audience === 'All Students' || audience === 'All') {
          
          // 4. Robust Date Parsing (Handles 'date' OR 'createdAt')
          const timestampField = data.date || data.createdAt;
          let dateObj;

          if (timestampField) {
            if (typeof timestampField.toDate === 'function') {
              dateObj = timestampField.toDate();
            } else if (timestampField instanceof Date) {
              dateObj = timestampField;
            } else {
              dateObj = new Date();
            }
          } else {
            dateObj = new Date();
          }

          loadedNotifications.push({
            id: doc.id,
            title: data.title || 'Notification',
            message: data.message || '',
            audience: audience,
            isImportant: data.isImportant || false,
            dateObj: dateObj,
            formattedDate: format(dateObj, 'MMM dd, h:mm a'),
            timeAgo: formatDistanceToNow(dateObj, { addSuffix: true })
          });
        }
      });

      setNotifications(loadedNotifications);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching notifications:', err);
      setError("Failed to load data. Please check your internet connection.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', pb: 4 }}>
      
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: '#fff', 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack} sx={{ bgcolor: 'grey.100' }}>
              <BackIcon />
            </IconButton>
            <Box>
                <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2 }}>
                Notifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                Updates from The Bethel Church
                </Typography>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Content */}
      <Container maxWidth="md">
        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Syncing updates...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={8}
            sx={{ opacity: 0.7 }}
          >
            <MegaphoneIcon sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight="bold">
              No new notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If you just sent one, check if the Audience matches.
            </Typography>
          </Box>
        ) : (
          <Fade in={!loading}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {notifications.map((notification) => (
                <Card 
                    key={notification.id} 
                    elevation={0}
                    sx={{ 
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        },
                        position: 'relative',
                        overflow: 'visible'
                    }}
                >
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 12, 
                            bottom: 12, 
                            width: 4, 
                            borderRadius: '0 4px 4px 0',
                            bgcolor: notification.isImportant ? '#ff1744' : '#2979ff' 
                        }} 
                    />

                    <CardHeader
                        avatar={
                            <Avatar 
                                sx={{ 
                                    bgcolor: notification.isImportant ? '#ffebee' : '#e3f2fd',
                                    color: notification.isImportant ? '#d32f2f' : '#1976d2'
                                }}
                            >
                                {notification.isImportant ? <PriorityIcon /> : <BellIcon />}
                            </Avatar>
                        }
                        title={
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '1.05rem' }}>
                                {notification.title}
                            </Typography>
                        }
                        subheader={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip 
                                    label={notification.audience} 
                                    size="small" 
                                    sx={{ 
                                        height: 20, 
                                        fontSize: '0.65rem', 
                                        fontWeight: 'bold',
                                        bgcolor: 'grey.100'
                                    }} 
                                />
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {notification.timeAgo}
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        action={
                            notification.isImportant && (
                                <Chip 
                                    label="IMPORTANT" 
                                    color="error" 
                                    size="small" 
                                    variant="filled"
                                    sx={{ fontWeight: 'bold', fontSize: '0.65rem', mr: 1 }}
                                />
                            )
                        }
                    />
                    
                    <CardContent sx={{ pt: 0, pl: 9 }}>
                        <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {notification.message}
                        </Typography>
                        <Divider sx={{ my: 2, opacity: 0.5 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', fontStyle: 'italic' }}>
                            Posted on {notification.formattedDate}
                        </Typography>
                    </CardContent>
                </Card>
                ))}
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
};

export default ParentNotificationPage;