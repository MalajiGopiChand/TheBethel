import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Button
} from '@mui/material';
import {
  Chat as ChatIcon,
  EventNote as AttendanceIcon,
  Assignment as HomeworkIcon,
  AttachMoney as DollarIcon,
  TrendingUp as ProgressIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import AttendanceCard from '../../../components/AttendanceCard';
import PodiumSection from '../../../components/PodiumSection';
import ActionGrid from '../../../components/ActionGrid';
import AnnouncementsSection from '../../../components/AnnouncementsSection';
import InstallBanner from '../../../components/InstallBanner';

const HomeTab = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [overview, setOverview] = useState({
    totalStudents: 0,
    attendancePercentage: 0,
    totalDollarsGiven: 0,
    totalRewards: 0,
    todayPresentCount: 0,
    todayAbsentCount: 0,
    topStudents: []
  });
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [error, setError] = useState(null);

  // Add error boundary for component errors
  useEffect(() => {
    const errorHandler = (event) => {
      console.error('HomeTab error:', event.error);
      setError(event.error?.message || 'An error occurred');
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  // Fetch announcements
  useEffect(() => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        notificationsQuery, 
        (snapshot) => {
          const announcementsData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const audience = data.audience || 'All';
            
            // Show announcements for Teachers, All, or targeted directly to this teacher
            if (audience === 'Teachers' || audience === 'All' || audience === currentUser?.name) {
              let createdAt;
              if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                  createdAt = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                  createdAt = data.createdAt;
                } else {
                  createdAt = new Date();
                }
              } else {
                createdAt = new Date();
              }
              
              announcementsData.push({
                id: doc.id,
                title: data.title || 'Announcement',
                message: data.message || '',
                date: format(createdAt, 'MMM dd, yyyy'),
                audience: audience,
                isImportant: data.isImportant || false
              });
            }
          });
          setAnnouncements(announcementsData.slice(0, 5));
        }, 
        (err) => {
          console.error('Error fetching announcements:', err);
          setError('Failed to load announcements');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up announcements listener:', err);
      setError('Failed to initialize announcements');
    }
  }, [currentUser?.name]);

  // Fetch upcoming schedules
  useEffect(() => {
    if (!currentUser?.name) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const schedulesQuery = query(
        collection(db, 'timetables'),
        where('assignedPersonName', '==', currentUser.name)
      );

      const unsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
        const schedulesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const validSchedules = schedulesList.filter(s => {
          let sDate = 0;
          if (s.date) {
            if (typeof s.date === 'number') sDate = s.date;
            else if (s.date.toDate) sDate = s.date.toDate().getTime();
          }
          // Include schedules from up to 7 days ago so recent test schedules are still visible
          const pastBuffer = 7 * 24 * 60 * 60 * 1000;
          return sDate >= (today.getTime() - pastBuffer);
        }).sort((a,b) => {
          const ad = a.date?.toDate ? a.date.toDate().getTime() : (a.date || 0);
          const bd = b.date?.toDate ? b.date.toDate().getTime() : (b.date || 0);
          return ad - bd;
        });

        // Get the closest upcoming sunday
        setUpcomingSchedules(validSchedules);
      }, (err) => {
        console.error('Error fetching schedules:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up schedules listener:', err);
    }
  }, [currentUser?.name]);

  // Helper function to calculate dollar points
  const calculateDollarPoints = (studentData) => {
    const rewardsList = studentData.rewards || [];
    let calculatedPoints = 0;
    
    for (const reward of rewardsList) {
      const points = reward.dollars;
      if (typeof points === 'number') {
        calculatedPoints += points;
      } else if (typeof points === 'string') {
        calculatedPoints += parseInt(points) || 0;
      }
    }
    
    return calculatedPoints > 0 ? calculatedPoints : (studentData.dollarPoints || 0);
  };

  // Fetch students data
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const students = snapshot.docs.map(doc => {
        const data = doc.data();
        const calculatedPoints = calculateDollarPoints(data);
        
        return {
          id: doc.id,
          ...data,
          dollarPoints: calculatedPoints,
          name: data.name || 'Unknown Student',
          attendance: data.attendance || []
        };
      });

      const totalStudents = students.length;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Calculate today's attendance
      const todayPresentCount = students.filter(student => 
        (student.attendance || []).some(date => {
          if (typeof date === 'string') {
            return date.startsWith(today);
          }
          return false;
        })
      ).length;
      
      const todayAbsentCount = totalStudents - todayPresentCount;
      const attendancePercentage = totalStudents > 0
        ? Math.round((todayPresentCount / totalStudents) * 100)
        : 0;

      // Calculate total dollars
      const totalDollarsGiven = students.reduce((sum, student) => 
        sum + (student.dollarPoints || 0), 0
      );

      // Calculate total rewards
      const totalRewards = students.reduce((sum, student) => 
        sum + (student.rewards?.length || 0), 0
      );

      // Calculate top students (unique names with total points)
      const studentDollarMap = new Map();
      students.forEach(student => {
        if (student.name && student.name !== 'Unknown Student') {
          const current = studentDollarMap.get(student.name) || 0;
          studentDollarMap.set(student.name, current + (student.dollarPoints || 0));
        }
      });

      const topStudents = Array.from(studentDollarMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, dollars]) => ({ name, dollars }));

      setOverview({
        totalStudents,
        attendancePercentage,
        totalDollarsGiven,
        totalRewards,
        todayPresentCount,
        todayAbsentCount,
        topStudents
      });
      
      setLoading(false);
    }, (error) => {
      console.error('Error fetching overview:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const quickActions = [
    {
      title: 'Live Chat',
      icon: <ChatIcon />,
      colorStart: '#4FACFE',
      colorEnd: '#00F2FE',
      isEnabled: true,
      onClick: () => navigate('/teacher/messaging')
    },
    {
      title: 'Attendance',
      icon: <AttendanceIcon />,
      colorStart: '#43E97B',
      colorEnd: '#38F9D7',
      isEnabled: true,
      onClick: () => navigate('/teacher/attendance')
    },
    {
      title: 'Homework',
      icon: <HomeworkIcon />,
      colorStart: '#FA709A',
      colorEnd: '#FEE140',
      isEnabled: true,
      onClick: () => navigate('/teacher/homework')
    },
    {
      title: 'Give Dollars',
      icon: <DollarIcon />,
      colorStart: '#FF5858',
      colorEnd: '#F09819',
      isEnabled: true,
      onClick: () => navigate('/teacher/dollars-giving')
    },
    {
      title: 'Report Submission',
      icon: <ProgressIcon />,
      colorStart: '#667eea',
      colorEnd: '#764ba2',
      isEnabled: true,
      onClick: () => navigate('/teacher/report-submission')
    },
    {
      title: 'My Profile',
      icon: <PersonIcon />,
      colorStart: '#8E2DE2',
      colorEnd: '#4A00E0',
      isEnabled: true,
      onClick: () => navigate('/teacher/profile')
    }
  ];

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading data
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()} 
          sx={{ mt: 2 }}
        >
          Reload Page
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Calculate grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 4;
  };

  return (
    <Box 
      sx={{ 
        pb: isMobile ? 8 : 4, // Add padding bottom for mobile bottom bar
        minHeight: '100vh',
        bgcolor: '#f8f9fa'
      }}
    >
      <Container maxWidth="lg" sx={{ px: isMobile ? 1.5 : 2, py: 2 }}>
        {/* Install Banner */}
        <InstallBanner />
        
        {/* Attendance Card */}
        <Box sx={{ mb: 2.5 }}>
          <AttendanceCard data={overview} canEdit={true} />
        </Box>

        {/* Upcoming Schedules */}
        {upcomingSchedules.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="600" 
              sx={{ mb: 1.5, px: 0.5 }}
            >
              🗓️ My Upcoming Schedule
            </Typography>
            {upcomingSchedules.map(schedule => {
              const scheduleDate = new Date(typeof schedule.date === 'number' ? schedule.date : schedule.date?.toDate?.() || Date.now());
              return (
                <Card 
                  key={schedule.id} 
                  elevation={1}
                  sx={{ 
                    mb: 1.5, 
                    borderLeft: '5px solid #2e7d32', 
                    bgcolor: '#f4fbf5', 
                    borderRadius: 2 
                  }}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 0.5 }}>
                          {schedule.place} • {schedule.className}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          {schedule.serviceType}
                          {schedule.assignedWork ? ` • ${schedule.assignedWork}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', borderLeft: '1px solid rgba(0,0,0,0.1)', pl: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {format(scheduleDate, 'MMM dd')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase' }}>
                          Sunday
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="600" 
              sx={{ mb: 1.5, px: 0.5 }}
            >
              📢 Announcements
            </Typography>
            <Box>
              <AnnouncementsSection announcements={announcements} />
            </Box>
          </Box>
        )}

        {/* Podium Section */}
        {overview.topStudents.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="600" 
              sx={{ mb: 1.5, px: 0.5 }}
            >
              🏆 Top Performers
            </Typography>
            <PodiumSection topStudents={overview.topStudents} />
          </Box>
        )}

        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight="600" 
            sx={{ mb: 1.5, px: 0.5 }}
          >
            Quick Actions
          </Typography>
          <ActionGrid actions={quickActions} />
        </Box>

        {/* Statistics Section */}
        <Box>
          <Typography 
            variant="subtitle1" 
            fontWeight="600" 
            sx={{ mb: 1.5, px: 0.5 }}
          >
            Statistics
          </Typography>
          
          <Grid container spacing={isMobile ? 1.5 : 2}>
            {/* Total Students Card */}
            <Grid item xs={6} md={3}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: isMobile ? 1.5 : 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  Total Students
                </Typography>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  fontWeight="700"
                  color="primary.main"
                >
                  {overview.totalStudents}
                </Typography>
              </Paper>
            </Grid>

            {/* Attendance Card */}
            <Grid item xs={6} md={3}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: isMobile ? 1.5 : 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  Attendance
                </Typography>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  fontWeight="700"
                  color="success.main"
                >
                  {overview.attendancePercentage}%
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {overview.todayPresentCount} present
                </Typography>
              </Paper>
            </Grid>

            {/* Dollars Given Card */}
            <Grid item xs={6} md={3}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: isMobile ? 1.5 : 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  Dollars Given
                </Typography>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  fontWeight="700"
                  color="warning.main"
                >
                  ${overview.totalDollarsGiven}
                </Typography>
              </Paper>
            </Grid>

            {/* Total Rewards Card */}
            <Grid item xs={6} md={3}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: isMobile ? 1.5 : 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  Total Rewards
                </Typography>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  fontWeight="700"
                  color="info.main"
                >
                  {overview.totalRewards}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Additional spacing for bottom bar */}
        {isMobile && <Box sx={{ height: 16 }} />}
      </Container>
    </Box>
  );
};

export default HomeTab;