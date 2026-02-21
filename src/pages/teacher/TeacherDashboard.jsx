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
  Slide,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  FactCheckRounded as AttendanceIcon,
  EmojiEventsRounded as RewardsIcon,
  LogoutRounded as LogoutIcon,
  Church as ChurchIcon,
  BoltRounded as BoltIcon,
  People as PeopleIcon,
  PeopleOutline as PeopleOutlineIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Components
import HomeTab from './components/HomeTab';
import AttendanceTab from './components/AttendanceTab';
import RewardsTab from './components/RewardsTab';
import TeachersTab from './components/TeachersTab';

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const [loadingLogout, setLoadingLogout] = useState(false);

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
    const tabs = [
      <HomeTab />, 
      <AttendanceTab />, 
      <RewardsTab />,
      <TeachersTab />
    ];

    return (
      <Fade in={true} key={currentTab} timeout={400}>
        <Box className="page-section-enter">
          {tabs[currentTab]}
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
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backgroundImage: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(18px)',
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
                  'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.7), transparent 55%), radial-gradient(circle at 100% 100%, rgba(56,189,248,0.3), transparent 55%), linear-gradient(135deg,#4C6FFF,#2332B3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 30px rgba(15,23,42,0.45)',
              }}
            >
              <ChurchIcon fontSize="small" />
            </Box>
            <Box sx={{ 
              overflow: 'hidden',
              [theme.breakpoints.down('sm')]: {
                maxWidth: 'calc(100vw - 140px)',
              }
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  letterSpacing: '-0.04em',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Teacher Workspace
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.7,
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentUser?.name || 'Teacher'} • {currentUser?.email}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {!isMobile && (
              <Chip
                icon={<BoltIcon />}
                label="Quick actions"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 999 }}
              />
            )}
            <Tooltip title="Logout">
              <IconButton
                onClick={handleLogout}
                disabled={loadingLogout}
                sx={{
                  bgcolor: 'rgba(15,23,42,0.95)',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'rgba(15,23,42,1)' },
                  flexShrink: 0,
                }}
              >
                {loadingLogout ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        pb: { xs: 10, sm: 12 }
      }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={500}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 0, sm: 24 },
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1100,
            px: { xs: 0, sm: 2 },
            pointerEvents: 'none',
          }}
        >
          <Paper
            elevation={isMobile ? 0 : 20}
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: 560 },
              borderRadius: { xs: 0, sm: '32px' },
              bgcolor: 'rgba(15,23,42,0.96)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              boxShadow: isMobile 
                ? '0 -4px 20px rgba(0,0,0,0.4)' 
                : '0 20px 50px rgba(0,0,0,0.5)',
              borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
              pointerEvents: 'auto',
            }}
          >
            <BottomNavigation
              value={currentTab}
              onChange={handleTabChange}
              showLabels
              sx={{
                bgcolor: 'transparent',
                height: { xs: 72, sm: 64 },
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 'auto',
                  padding: { xs: '12px 4px', sm: '8px 4px' },
                  color: 'rgba(148,163,184,0.6)',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                  '&:hover': {
                    color: theme.palette.primary.light,
                  },
                },
                '& .MuiSvgIcon-root': {
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: { xs: '1.8rem', sm: '1.6rem' },
                },
                '& .Mui-selected .MuiSvgIcon-root': {
                  transform: { xs: 'translateY(-4px) scale(1.15)', sm: 'translateY(-4px) scale(1.15)' },
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: { xs: 10, sm: 11 },
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  mt: { xs: 0.5, sm: 0 },
                },
                '& .Mui-selected .MuiBottomNavigationAction-label': {
                  fontSize: { xs: 11, sm: 12 },
                  fontWeight: 800,
                },
              }}
            >
              <BottomNavigationAction 
                label="Home" 
                icon={<HomeIcon />} 
              />
              <BottomNavigationAction 
                label="Attendance" 
                icon={<AttendanceIcon />} 
              />
              <BottomNavigationAction 
                label="Rewards" 
                icon={<RewardsIcon />} 
              />
              <BottomNavigationAction
                label="Teachers"
                icon={currentTab === 3 ? <PeopleIcon /> : <PeopleOutlineIcon />}
              />
            </BottomNavigation>
          </Paper>
        </Box>
      </Slide>
    </Box>
  );
};

export default TeacherDashboard;