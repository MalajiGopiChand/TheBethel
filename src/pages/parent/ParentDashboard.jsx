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
  Tooltip
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  AssignmentRounded as HomeworkIcon,
  EmojiEventsRounded as LeaderboardIcon,
  PersonRounded as ProfileIcon,
  LogoutRounded as LogoutIcon,
  Church as ChurchIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

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
  
  const [currentTab, setCurrentTab] = useState(0);
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
        <LeaderboardTab />,
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
        bgcolor: '#f4f6f8', // Softer background
        backgroundImage: 'radial-gradient(circle at 50% -20%, #e3f2fd 0%, transparent 40%)' // Subtle top glow
    }}>
      
      {/* Top App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent
            backdropFilter: 'blur(12px)', // Glass effect
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary'
        }}
      >
        <Toolbar>
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '12px', bgcolor: theme.palette.primary.main, color: '#fff', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' }}>
             <ChurchIcon fontSize="small" />
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: '800', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              The Bethel Church
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 'medium' }}>
              Parent Portal • {currentUser?.name?.split(' ')[0] || 'Guest'}
            </Typography>
          </Box>
          
          <Tooltip title="Logout">
            <IconButton 
                onClick={handleLogout} 
                disabled={loadingLogout}
                sx={{ 
                    bgcolor: 'grey.100', 
                    '&:hover': { bgcolor: 'grey.200', color: 'error.main' },
                    transition: 'all 0.2s'
                }}
            >
                {loadingLogout ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, pb: 12 }}> {/* Extra padding for floating nav */}
        <Container maxWidth="md" sx={{ py: 3, px: isMobile ? 2 : 3 }}>
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation (Glassmorphism Dock) */}
      <Paper 
        sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            bgcolor: 'rgba(255, 255, 255, 0.85)', // High transparency
            backdropFilter: 'blur(16px)', // Heavy blur
            borderTop: '1px solid rgba(0,0,0,0.05)'
        }} 
        elevation={0}
      >
        <Container maxWidth="md" disableGutters>
            <BottomNavigation
            value={currentTab}
            onChange={(event, newValue) => {
                setCurrentTab(newValue);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showLabels
            sx={{
                height: 70, // Taller touch target
                bgcolor: 'transparent',
                '& .MuiBottomNavigationAction-root': {
                    minWidth: 'auto',
                    padding: '8px 0',
                    color: 'text.secondary',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                        color: theme.palette.primary.main,
                        transform: 'translateY(-2px)', // Slight lift on active
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.7rem',
                            filter: `drop-shadow(0 4px 6px ${theme.palette.primary.light}40)` // Glow effect
                        }
                    },
                    '& .MuiSvgIcon-root': {
                        transition: 'all 0.3s',
                        fontSize: '1.5rem',
                        mb: 0.5
                    },
                    '& .MuiBottomNavigationAction-label': {
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        '&.Mui-selected': {
                            fontSize: '0.75rem'
                        }
                    }
                }
            }}
            >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Homework" icon={<HomeworkIcon />} />
            <BottomNavigationAction label="Leaderboard" icon={<LeaderboardIcon />} />
            <BottomNavigationAction label="Profile" icon={<ProfileIcon />} />
            </BottomNavigation>
        </Container>
      </Paper>
    </Box>
  );
};

export default ParentDashboard;