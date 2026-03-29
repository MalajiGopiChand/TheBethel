import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Avatar,
  Tooltip,
  Slide,
  Chip,
  Snackbar,
  Button
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  HomeOutlined as HomeOutlinedIcon,
  AssignmentRounded as HomeworkIcon,
  AssignmentOutlined as HomeworkOutlinedIcon,
  EmojiEventsRounded as LeaderboardIcon,
  EmojiEventsOutlined as LeaderboardOutlinedIcon,
  PersonRounded as ProfileIcon,
  PersonOutlined as ProfileOutlinedIcon,
  LogoutRounded as LogoutIcon,
  Church as ChurchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';
import InstallButton from '../../components/InstallButton';

// Ensure these components exist in your project structure
import HomeTab from './components/HomeTab';
import HomeworkTab from './components/HomeworkTab';
import LeaderboardTab from './components/LeaderboardTab';
import ProfileTab from './components/ProfileTab';

const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = sessionStorage.getItem('ParentDashboard_currentTab');
    return savedTab ? parseInt(savedTab, 10) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem('ParentDashboard_currentTab', currentTab.toString());
  }, [currentTab]);
  const [loadingLogout, setLoadingLogout] = useState(false);
  
  // Student Data State
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);


  // 1. Fetch Student Data Real-time
  useEffect(() => {
    if (!currentUser?.studentId) {
      setStudent(null);
      setLoadingStudent(false);
      return;
    }

    setLoadingStudent(true);
    const studentsQuery = query(
      collection(db, 'students'),
      where('studentId', '==', currentUser.studentId)
    );
    
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();
        
        // --- POINTS CALCULATION FIX ---
        const rewardsList = studentData.rewards || [];
        let calculatedPoints = 0;
        
        if (Array.isArray(rewardsList)) {
            rewardsList.forEach(reward => {
                const points = reward?.dollars;
                if (typeof points === 'number') {
                    calculatedPoints += points;
                } else if (typeof points === 'string') {
                    calculatedPoints += parseInt(points) || 0;
                }
            });
        }
        
        const finalPoints = calculatedPoints > 0 ? calculatedPoints : (studentData.dollarPoints || 0);
        
        setStudent({
          id: studentDoc.id,
          ...studentData,
          dollarPoints: finalPoints
        });
      } else {
        setStudent(null);
      }
      setLoadingStudent(false);
    }, (error) => {
      console.error('Error fetching student data:', error);
      setLoadingStudent(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Handle Logout
  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoadingLogout(false);
    }
  };

  // 3. Render Content Based on Tab
  const renderTabContent = () => {
    if (loadingStudent) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} thickness={4} />
        </Box>
      );
    }

    const tabs = [
        <HomeTab student={student} />,
        <HomeworkTab student={student} />,
        <LeaderboardTab student={student} />,
        <ProfileTab student={student} parentUser={currentUser} />
    ];

    return (
        <Fade in={true} key={currentTab} timeout={300}>
            <Box>
                {tabs[currentTab]}
            </Box>
        </Fade>
    );
  };

  return (
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        position: 'relative'
    }}>
      
      {/* Top App Bar - Matched to Teacher Dashboard UI */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backgroundImage: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(22px)',
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'rgba(15,23,42,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 30px rgba(15,23,42,0.55)',
              }}
            >
              <Box
                component="img"
                src="/image.png"
                alt="Bethel AMS"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.03em', color: '#000' }}>
                Parent Dashboard
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#000' }}>
                {student?.name || currentUser?.name || 'Guest'}
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label="Parent Portal • Live"
                sx={{ borderRadius: 999 }}
              />
              <InstallButton size="small" />
              <Button
                color="inherit"
                onClick={handleLogout}
                disabled={loadingLogout}
                startIcon={!loadingLogout && <LogoutIcon />}
                sx={{ borderRadius: 999, px: 2.5, color: '#000', fontWeight: 'bold' }}
              >
                {loadingLogout ? <CircularProgress size={18} color="inherit" /> : 'Logout'}
              </Button>
            </Box>
          )}

          {isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <InstallButton size="small" />
              <Tooltip title={`Logout (${currentUser?.name || 'User'})`}>
                <Button
                  onClick={handleLogout}
                  disabled={loadingLogout}
                  sx={{
                    minWidth: 'auto',
                    p: '6px 12px',
                    color: '#d32f2f',
                    borderRadius: 2,
                    bgcolor: 'rgba(211,47,47,0.08)',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}
                  startIcon={!loadingLogout && <LogoutIcon sx={{ width: 18, height: 18 }} />}
                >
                  {loadingLogout ? <CircularProgress size={16} color="inherit" /> : 'Logout'}
                </Button>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, pb: 12, position: 'relative', zIndex: 1 }}> {/* Extra padding for floating nav */}
        <Container maxWidth="md" sx={{ py: 3, px: isMobile ? 2 : 3 }}>
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation – glass floating dock */}
      <Paper
        className="page-card-enter"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          borderRadius: 999,
          bgcolor: 'rgba(15,23,42,0.96)',
          backdropFilter: 'blur(24px)',
          px: 1,
          boxShadow: '0 22px 60px rgba(15,23,42,0.9)',
          width: '92%',
          maxWidth: 620,
        }}
        elevation={0}
      >
        <BottomNavigation
          value={currentTab}
          onChange={(event, newValue) => {
              setCurrentTab(newValue);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          showLabels
          sx={{
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '8px 6px',
              color: 'rgba(148,163,184,0.75)',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              '& .MuiSvgIcon-root': {
                transition: 'all 0.25s ease',
              },
              '&.Mui-selected .MuiSvgIcon-root': {
                transform: 'translateY(-3px) scale(1.15)',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: 11,
                fontWeight: 600,
              },
            },
          }}
        >
          <BottomNavigationAction label="Home" icon={currentTab === 0 ? <HomeIcon /> : <HomeOutlinedIcon />} />
          <BottomNavigationAction label="Homework" icon={currentTab === 1 ? <HomeworkIcon /> : <HomeworkOutlinedIcon />} />
          <BottomNavigationAction label="Leaderboard" icon={currentTab === 2 ? <LeaderboardIcon /> : <LeaderboardOutlinedIcon />} />
          <BottomNavigationAction label="Profile" icon={currentTab === 3 ? <ProfileIcon /> : <ProfileOutlinedIcon />} />
        </BottomNavigation>
      </Paper>

      {/* PWA Install Prompt - Cross Platform */}
      <PWAInstallPrompt />
    </Box>
  );
};

export default ParentDashboard;