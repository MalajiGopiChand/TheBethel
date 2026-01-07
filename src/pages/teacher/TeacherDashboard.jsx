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
  Avatar,
  Tooltip,
  useTheme,
  Fade,
  Slide,
  Grow,
  useMediaQuery,
  Zoom
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  FactCheckRounded as AttendanceIcon,
  EmojiEventsRounded as RewardsIcon,
  PeopleRounded as StudentsIcon,
  SchoolRounded as TeachersIcon,
  LogoutRounded as LogoutIcon,
  Church as ChurchIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Components
import HomeTab from './components/HomeTab';
import AttendanceTab from './components/AttendanceTab';
import RewardsTab from './components/RewardsTab';
import StudentsTab from './components/StudentsTab';
import TeachersTab from './components/TeachersTab';

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animations
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const renderTabContent = () => {
    const tabs = [
      <HomeTab />,
      <AttendanceTab />,
      <RewardsTab />,
      <StudentsTab />,
      <TeachersTab />
    ];

    // Smooth transition between tabs
    return (
      <Fade in={true} key={currentTab} timeout={500}>
        <Box>
           <Slide direction="up" in={true} mountOnEnter unmountOnExit key={currentTab}>
              <Box>{tabs[currentTab]}</Box>
           </Slide>
        </Box>
      </Fade>
    );
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        // Animated Gradient Background
        background: 'linear-gradient(-45deg, #f5f7fa, #c3cfe2, #e3f2fd, #f5f7fa)',
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite',
        '@keyframes gradientBG': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      }}
    >
      
      {/* 1. Header (Slides Down on Load) */}
      <Slide direction="down" in={mounted} timeout={800}>
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            top: 0,
            zIndex: 1100
          }}
        >
          <Toolbar>
            {/* Logo */}
            <Zoom in={mounted} style={{ transitionDelay: '300ms' }}>
              <Box 
                sx={{ 
                  mr: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 42, 
                  height: 42, 
                  borderRadius: '14px', 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: '#fff', 
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' 
                }}
              >
                <ChurchIcon fontSize="small" />
              </Box>
            </Zoom>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                The Bethel Church
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 'medium' }}>
                Teacher Portal
              </Typography>
            </Box>

            {/* Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {!isMobile && (
                <Fade in={mounted} timeout={1000}>
                    <Box textAlign="right">
                        <Typography variant="body2" fontWeight="bold" lineHeight={1}>
                        {currentUser?.name || 'Teacher'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                        {currentUser?.email}
                        </Typography>
                    </Box>
                </Fade>
              )}
              
              <Tooltip title="Logout">
                <IconButton 
                  onClick={handleLogout} 
                  disabled={loadingLogout}
                  sx={{ 
                    bgcolor: 'white',
                    boxShadow: 1,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'error.50', color: 'error.main', transform: 'scale(1.05)' }
                  }}
                >
                  {loadingLogout ? <CircularProgress size={20} /> : <LogoutIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
      </Slide>

      {/* 2. Main Content Area */}
      <Box sx={{ flexGrow: 1, pb: 14 }}> {/* Deep padding for floating dock */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {renderTabContent()}
        </Container>
      </Box>

      {/* 3. Floating Animated Navigation Dock */}
      <Slide direction="up" in={mounted} timeout={800}>
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1000,
            borderRadius: '24px',
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            width: '92%',
            maxWidth: 500,
            overflow: 'hidden'
          }} 
          elevation={0}
        >
          <BottomNavigation
            value={currentTab}
            onChange={(event, newValue) => {
              setCurrentTab(newValue);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showLabels={!isMobile}
            sx={{
              bgcolor: 'transparent',
              height: 72,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                color: 'text.secondary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                
                // Hover Effects
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  '& .MuiSvgIcon-root': { transform: 'scale(1.1)' }
                },

                // Active State Animation
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.8rem',
                    transform: 'translateY(-4px)',
                    filter: `drop-shadow(0 6px 4px ${theme.palette.primary.light}50)`
                  },
                  '& .MuiBottomNavigationAction-label': {
                    opacity: 1,
                    transform: 'translateY(2px)'
                  }
                },
                
                // Icons
                '& .MuiSvgIcon-root': {
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy transition
                  fontSize: '1.5rem',
                  mb: isMobile ? 0 : 0.5
                },
                
                // Labels
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: '700',
                  fontSize: '0.7rem',
                  transition: 'all 0.3s',
                  '&.Mui-selected': { fontSize: '0.75rem' }
                }
              }
            }}
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Attend" icon={<AttendanceIcon />} />
            <BottomNavigationAction label="Rewards" icon={<RewardsIcon />} />
              {/* <BottomNavigationAction label="Students" icon={<StudentsIcon />} /> */}
            {/* <BottomNavigationAction label="Staff" icon={<TeachersIcon />} /> */}
          </BottomNavigation>
        </Paper>
      </Slide>
    </Box>
  );
};

export default TeacherDashboard;