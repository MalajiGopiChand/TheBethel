import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  Paper,
  Divider,
  Avatar,
  Container
} from '@mui/material';
import {
  AttachMoney as DollarIcon,
  LocalFireDepartment as StreakIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  WavingHand as WaveIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  limit, // Added limit
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import AnnouncementsSection from '../../../components/AnnouncementsSection';
import InstallBanner from '../../../components/InstallBanner';

const HomeTab = ({ student }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // 1. QUERY FIX: Use 'date' to match Android App & Admin Panel
    // Added limit(5) so we don't fetch unnecessary history for the dashboard
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('date', 'desc'), 
      limit(5) 
    );
    
    // 2. Real-time Listener
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const announcementsData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const audience = data.audience || 'All';

        // 3. Audience Filter
        if (audience === 'Parents' || audience === 'All Students' || audience === 'All') {
          
          // 4. Robust Date Parsing (Handles 'date' field)
          // We check data.date first (Android standard), then fallback to createdAt
          const timestamp = data.date || data.createdAt;
          let dateObj;

          if (timestamp) {
            if (typeof timestamp.toDate === 'function') {
              dateObj = timestamp.toDate();
            } else if (timestamp instanceof Date) {
              dateObj = timestamp;
            } else {
              dateObj = new Date();
            }
          } else {
            dateObj = new Date();
          }

          announcementsData.push({
            id: doc.id,
            title: data.title || '',
            message: data.message || '',
            date: format(dateObj, 'MMM dd, yyyy'),
            audience: audience,
            isImportant: data.isImportant || false
          });
        }
      });
      setAnnouncements(announcementsData);
    }, (error) => {
      console.error("Error getting announcements:", error);
    });

    return () => unsubscribe();
  }, []); // Removed [student] dependency so it loads even if student data is delayed

  if (!student) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          Loading student data...
        </Typography>
        <CircularProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Calculations
  const attendanceList = student.attendance || [];
  const absentDates = student.absentDates || [];
  const totalDays = attendanceList.length + absentDates.length;
  const attendancePercentage = totalDays > 0
    ? Math.round((attendanceList.length / totalDays) * 100)
    : 0;

  // Helper for Circular Progress
  const CircularProgressWithLabel = (props) => {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress 
          variant="determinate" 
          size={90} 
          thickness={5} 
          {...props} 
          sx={{ 
            color: props.value >= 75 ? '#4caf50' : props.value >= 50 ? '#ff9800' : '#f44336',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(0,0,0,0.05)'
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" component="div" color="text.primary" fontWeight="800">
            {`${Math.round(props.value)}%`}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 10 }}> 
      {/* Install Banner */}
      <InstallBanner />
      
      {/* 1. Welcome Banner */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 4, 
          background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h4" fontWeight="800">
                Welcome back, {student.name ? student.name : 'Student'}
                </Typography>
                <WaveIcon sx={{ animation: 'wave 2s infinite', transformOrigin: '70% 70%' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" />
                {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </Typography>
        </Box>
        
        {/* Decorative Circle overlay */}
        <Box sx={{ 
            position: 'absolute', 
            top: -20, 
            right: -20, 
            width: 150, 
            height: 150, 
            borderRadius: '50%', 
            bgcolor: 'rgba(255,255,255,0.1)' 
        }} />
        <SchoolIcon sx={{ 
            position: 'absolute', 
            bottom: -10, 
            right: 20, 
            fontSize: 100, 
            opacity: 0.15,
            transform: 'rotate(-15deg)'
        }} />
      </Paper>

      {/* 2. Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* A. Attendance */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
                height: '100%', 
                borderRadius: 4, 
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center' 
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                Attendance
              </Typography>
              <Box sx={{ my: 2 }}>
                <CircularProgressWithLabel value={attendancePercentage} />
              </Box>
              
              <Box display="flex" justifyContent="center" gap={3} mt={1}>
                <Box textAlign="center">
                    <Typography variant="h6" color="success.main" fontWeight="bold" lineHeight={1}>
                        {attendanceList.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Present</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box textAlign="center">
                    <Typography variant="h6" color="error.main" fontWeight="bold" lineHeight={1}>
                        {absentDates.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Absent</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B. Dollar Points */}
        <Grid item xs={12} sm={6} md={4}>
            <Card 
                elevation={3} 
                sx={{ 
                    height: '100%',
                    borderRadius: 4, 
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" zIndex={2}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="medium" sx={{ opacity: 0.9 }}>
                                Dollar Points
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ mt: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                ${student.dollarPoints || 0}
                            </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                            <DollarIcon />
                        </Avatar>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.9, zIndex: 2 }}>
                        Great job! Keep earning rewards.
                    </Typography>
                    <DollarIcon sx={{ 
                        position: 'absolute', bottom: -15, right: -15, fontSize: 120, opacity: 0.2, transform: 'rotate(-20deg)'
                    }} />
                </CardContent>
            </Card>
        </Grid>

        {/* C. Streak */}
        <Grid item xs={12} sm={6} md={4}>
            <Card 
                elevation={3} 
                sx={{ 
                    height: '100%',
                    borderRadius: 4, 
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" zIndex={2}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="medium" sx={{ opacity: 0.9 }}>
                                Current Streak
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ mt: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {student.currentStreak || 0}
                            </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                            <StreakIcon />
                        </Avatar>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.9, zIndex: 2 }}>
                        Days in a row. You're on fire!
                    </Typography>
                     <StreakIcon sx={{ 
                        position: 'absolute', bottom: -15, right: -15, fontSize: 120, opacity: 0.2, transform: 'rotate(-20deg)'
                    }} />
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      {/* 3. Announcements Section */}
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6" fontWeight="bold">
                📢 Latest Updates
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
        </Box>
        
        {announcements.length > 0 ? (
            <AnnouncementsSection announcements={announcements} />
        ) : (
            <Paper 
                elevation={0}
                sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    borderRadius: 3, 
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider'
                }}
            >
                <Typography variant="body1" color="text.secondary">
                    No new announcements.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    (Checked 'date' field in database)
                </Typography>
            </Paper>
        )}
      </Box>

    </Box>
  );
};

export default HomeTab;