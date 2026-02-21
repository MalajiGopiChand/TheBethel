import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DashboardOutlined as DashboardOutlinedIcon,
  FactCheck as AttendanceIcon,
  FactCheckOutlined as AttendanceOutlinedIcon,
  ManageAccounts as ManageIcon,
  ManageAccountsOutlined as ManageOutlinedIcon,
  School as SchoolIcon,
  SchoolOutlined as SchoolOutlinedIcon,
  Settings as SettingsIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  Logout as LogoutIcon,
  NotificationsActiveRounded as NotificationsIcon,
  BoltRounded as BoltIcon,
} from '@mui/icons-material';

// Import Contexts and Types
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

// Import Tab Components
import AdminHomeTab from './components/AdminHomeTab';
import AdminAttendanceTab from './components/AdminAttendanceTab';
import AdminManageTab from './components/AdminManageTab';
import AdminTeachersTab from './components/AdminTeachersTab';
import AdminMoreTab from './components/AdminMoreTab';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';

// Define allowed admin emails here for easier maintenance
const ADMIN_EMAILS = [
  'gop1@gmail.com',
  'premkumartenali@gmail.com'
];

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false); // For actions like logout
  const [checkingAuth, setCheckingAuth] = useState(true); // For initial role check
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyAdminStatus = () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      // Check if user is admin via Role OR specific Email allowlist
      const isRoleAdmin = currentUser.role === UserRole.ADMIN;
      const isEmailAdmin = ADMIN_EMAILS.includes(currentUser.email);

      if (!isRoleAdmin && !isEmailAdmin) {
        console.warn('Access Denied: User is not an admin.');
        navigate('/');
      } else {
        setCheckingAuth(false);
      }
    };

    verifyAdminStatus();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    const content = (() => {
      switch (currentTab) {
        case 0: return <AdminHomeTab />;
        case 1: return <AdminAttendanceTab />;
        case 2: return <AdminManageTab />;
        case 3: return <AdminTeachersTab />;
        case 4: return <AdminMoreTab />;
        default: return <AdminHomeTab />;
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

  // Show a full-screen loader while verifying admin privileges
  if (checkingAuth) {
    return (
      <Box
        className="page-shell page-glow-background"
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      className="page-shell page-glow-background"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Top App Bar with quick actions */}
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
                Bethel Control Center
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Admin • {currentUser?.name || currentUser?.email}
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label="Live • Today’s overview"
                sx={{ borderRadius: 999 }}
              />
              <Tooltip title="Notifications">
                <IconButton
                  sx={{
                    bgcolor: 'rgba(15,23,42,0.9)',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'rgba(15,23,42,1)' },
                  }}
                >
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <Button
                color="inherit"
                onClick={handleLogout}
                disabled={loading}
                startIcon={!loading && <LogoutIcon />}
                sx={{ borderRadius: 999, px: 2.5 }}
              >
                {loading ? <CircularProgress size={18} color="inherit" /> : 'Logout'}
              </Button>
            </Box>
          )}

          {isMobile && (
            <IconButton
              onClick={handleLogout}
              disabled={loading}
              sx={{
                ml: 1,
                bgcolor: 'rgba(15,23,42,0.92)',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'rgba(15,23,42,1)' },
              }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon />}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 12 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Quick actions row */}
          <Box
            className="page-card-enter"
            sx={{
              mb: 3,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <Chip
              icon={<DashboardIcon />}
              label="Today’s snapshot"
              color="primary"
              variant="filled"
              sx={{ borderRadius: 999 }}
            />
            <Chip
              icon={<AttendanceIcon />}
              label="Mark staff attendance"
              variant="outlined"
              sx={{ borderRadius: 999 }}
              onClick={() => setCurrentTab(1)}
            />
            <Chip
              icon={<ManageIcon />}
              label="Manage students"
              variant="outlined"
              sx={{ borderRadius: 999 }}
              onClick={() => setCurrentTab(2)}
            />
          </Box>

          {/* Render the selected tab with animation */}
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation – new glass floating dock feel */}
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
          onChange={(event, newValue) => setCurrentTab(newValue)}
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
            icon={currentTab === 0 ? <DashboardIcon /> : <DashboardOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Attendance"
            icon={currentTab === 1 ? <AttendanceIcon /> : <AttendanceOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Manage"
            icon={currentTab === 2 ? <ManageIcon /> : <ManageOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Staff"
            icon={currentTab === 3 ? <SchoolIcon /> : <SchoolOutlinedIcon />}
          />
          <BottomNavigationAction
            label="More"
            icon={currentTab === 4 ? <SettingsIcon /> : <SettingsOutlinedIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* PWA Install Prompt - Cross Platform */}
      <PWAInstallPrompt />
    </Box>
  );
};

export default AdminDashboard;