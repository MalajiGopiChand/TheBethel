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
  Container,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  AttachMoney as DollarIcon,
  LocalFireDepartment as StreakIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  WavingHand as WaveIcon,
  Close as CloseIcon
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
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

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
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(255,160,0,0.4)' }
                }}
            >
              <CardActionArea onClick={() => setIsRewardModalOpen(true)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                    <Typography variant="caption" fontWeight="bold" sx={{ mt: 2, display: 'inline-block', opacity: 0.9, zIndex: 2, bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                        Tap to view history 👉
                    </Typography>
                    <DollarIcon sx={{ 
                        position: 'absolute', bottom: -15, right: -15, fontSize: 120, opacity: 0.2, transform: 'rotate(-20deg)'
                    }} />
                </CardContent>
              </CardActionArea>
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
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(238,82,83,0.4)' }
                }}
            >
              <CardActionArea onClick={() => setIsStreakModalOpen(true)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                    <Typography variant="caption" fontWeight="bold" sx={{ mt: 2, display: 'inline-block', opacity: 0.9, zIndex: 2, bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                        Tap to view attendance 👉
                    </Typography>
                     <StreakIcon sx={{ 
                        position: 'absolute', bottom: -15, right: -15, fontSize: 120, opacity: 0.2, transform: 'rotate(-20deg)'
                    }} />
                </CardContent>
              </CardActionArea>
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

      {/* Rewards History Modal */}
      <Dialog 
        open={isRewardModalOpen} 
        onClose={() => setIsRewardModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="900" display="flex" alignItems="center" gap={1}>
             <DollarIcon color="warning" /> Dollar Points History
          </Typography>
          <IconButton onClick={() => setIsRewardModalOpen(false)} sx={{ bgcolor: 'action.hover' }}>
             <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {(!student.rewards || student.rewards.length === 0) ? (
            <Box p={4} textAlign="center">
                <Avatar sx={{ mx: 'auto', bgcolor: 'transparent', color: 'text.secondary', width: 64, height: 64, mb: 2 }}>
                    <DollarIcon fontSize="large" />
                </Avatar>
                <Typography color="text.secondary" fontWeight="600">No rewards recorded yet.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...student.rewards].sort((a,b) => (b.date || '').localeCompare(a.date || '')).map((reward, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{reward.date || 'N/A'}</TableCell>
                      <TableCell>
                          <Typography color="success.main" fontWeight="900">
                             +${reward.dollars}
                          </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{reward.reason || '-'}</TableCell>
                      <TableCell>
                          <Chip size="small" label={reward.teacher || reward.awardedBy || '-'} sx={{ fontWeight: 600, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Streak History Modal */}
      <Dialog 
        open={isStreakModalOpen} 
        onClose={() => setIsStreakModalOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="900" display="flex" alignItems="center" gap={1}>
             <StreakIcon color="error" /> Attendance Log
          </Typography>
          <IconButton onClick={() => setIsStreakModalOpen(false)} sx={{ bgcolor: 'action.hover' }}>
             <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {(!student.attendance || student.attendance.length === 0) ? (
            <Box p={4} textAlign="center">
                <Avatar sx={{ mx: 'auto', bgcolor: 'transparent', color: 'text.secondary', width: 64, height: 64, mb: 2 }}>
                    <StreakIcon fontSize="large" />
                </Avatar>
                <Typography color="text.secondary" fontWeight="600">No attendance recorded yet.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[...student.attendance].sort((a,b) => (b || '').localeCompare(a || '')).map((dateStr, i) => {
                    const teacherName = student.attendanceByDate?.[dateStr]?.teacherName || '-';
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{dateStr}</TableCell>
                        <TableCell>
                            <Chip size="small" label={teacherName} sx={{ fontWeight: 600, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', maxWidth: 120 }} />
                        </TableCell>
                        <TableCell align="right">
                            <Chip size="small" label="Present" sx={{ fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default HomeTab;