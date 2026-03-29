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
  Tooltip,
  useTheme,
  Fade,
  useMediaQuery,
  Chip,
  Button,
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  HomeOutlined as HomeOutlinedIcon,
  FactCheckRounded as AttendanceIcon,
  FactCheckOutlined as AttendanceOutlinedIcon,
  EmojiEventsRounded as RewardsIcon,
  EmojiEventsOutlined as RewardsOutlinedIcon,
  LogoutRounded as LogoutIcon,
  Church as ChurchIcon,
  BoltRounded as BoltIcon,
  People as PeopleIcon,
  PeopleOutlined as PeopleOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';
import InstallButton from '../../components/InstallButton';

// Components
import HomeTab from './components/HomeTab';
import AttendanceTab from './components/AttendanceTab';
import RewardsTab from './components/RewardsTab';
import TeachersTab from './components/TeachersTab';

const TeacherDashboard = () => {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = sessionStorage.getItem('TeacherDashboard_currentTab');
    return savedTab ? parseInt(savedTab, 10) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem('TeacherDashboard_currentTab', currentTab.toString());
  }, [currentTab]);
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Redirect if not authenticated or not a teacher - improved for PWA
  useEffect(() => {
    // Only redirect if auth is fully loaded
    if (!authLoading) {
      if (!currentUser) {
        // Small delay to prevent race conditions in PWA
        const timer = setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
        return () => clearTimeout(timer);
      }
      
      // Ensure user has a role before checking
      if (!currentUser.role) {
        return; // Wait for role to be loaded
      }
      
      // Check if user is admin (should redirect to admin dashboard)
      const isAdmin = currentUser.role === UserRole.ADMIN || 
        currentUser.email === 'gop1@gmail.com' || 
        currentUser.email === 'premkumartenali@gmail.com';
      
      if (isAdmin) {
        const timer = setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 100);
        return () => clearTimeout(timer);
      }
      
      // Check if user is a teacher
      if (currentUser.role !== UserRole.TEACHER) {
        const timer = setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, authLoading, navigate]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Don't render if user is not authenticated - show loading instead of null
  if (!currentUser || currentUser.role !== UserRole.TEACHER) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTabContent = () => {
    const content = (() => {
      switch (currentTab) {
        case 0: return <HomeTab />;
        case 1: return <AttendanceTab />;
        case 2: return <RewardsTab />;
        case 3: return <TeachersTab />;
        default: return <HomeTab />;
      }
    })();

    return (
      <Fade in timeout={350}>
        <Box className="page-section-enter">
          {content}
        </Box>
      </Fade>
    );
  };

  return (
    <Box
      className="page-shell page-glow-background"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Top App Bar */}
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
                Teacher Dashboard
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#000' }}>
                {currentUser?.name || currentUser?.email}
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label="Live • Today's overview"
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
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 12 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
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
          onChange={handleTabChange}
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
          <BottomNavigationAction
            label="Home"
            icon={currentTab === 0 ? <HomeIcon /> : <HomeOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Attendance"
            icon={currentTab === 1 ? <AttendanceIcon /> : <AttendanceOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Rewards"
            icon={currentTab === 2 ? <RewardsIcon /> : <RewardsOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Teachers"
            icon={currentTab === 3 ? <PeopleIcon /> : <PeopleOutlinedIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </Box>
  );
};

export default TeacherDashboard;