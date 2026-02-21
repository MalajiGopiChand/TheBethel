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

  const [currentTab, setCurrentTab] = useState(0);
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
                background:
                  'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.7), transparent 55%), radial-gradient(circle at 100% 100%, rgba(244,114,182,0.7), transparent 55%), linear-gradient(135deg,#0f172a,#020617)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 18px 40px rgba(15,23,42,0.65)',
              }}
            >
              <BoltIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
                Teacher Workspace
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Teacher • {currentUser?.name || currentUser?.email}
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
                sx={{ borderRadius: 999, px: 2.5 }}
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
                  startIcon={loadingLogout ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
                  sx={{
                    bgcolor: 'rgba(15,23,42,0.92)',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'rgba(15,23,42,1)' },
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    px: 1.5,
                    minWidth: 'auto'
                  }}
                >
                  {loadingLogout ? '' : (currentUser?.name?.split(' ')[0] || 'User')}
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