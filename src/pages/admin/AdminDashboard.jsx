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
  Alert
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
  Logout as LogoutIcon
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

// Define allowed admin emails here for easier maintenance
const ADMIN_EMAILS = [
  'gop1@gmail.com',
  'premkumartenali@gmail.com'
];

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
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
    switch (currentTab) {
      case 0: return <AdminHomeTab />;
      case 1: return <AdminAttendanceTab />;
      case 2: return <AdminManageTab />;
      case 3: return <AdminTeachersTab />;
      case 4: return <AdminMoreTab />;
      default: return <AdminHomeTab />;
    }
  };

  // Show a full-screen loader while verifying admin privileges
  if (checkingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Top App Bar */}
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Bethel Church Admin
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {currentUser?.name || currentUser?.email || 'Admin'}
            </Typography>
            
            <Button 
              color="inherit" 
              onClick={handleLogout} 
              disabled={loading} 
              startIcon={!loading && <LogoutIcon />}
              size="small"
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Logout'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 10 }}> 
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {/* Render the selected tab */}
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={6}>
        <BottomNavigation
          value={currentTab}
          onChange={(event, newValue) => setCurrentTab(newValue)}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 0'
            }
          }}
        >
          <BottomNavigationAction 
            label="Home" 
            icon={currentTab === 0 ? <DashboardIcon /> : <DashboardOutlinedIcon />} 
          />
          <BottomNavigationAction 
            label="Attend" 
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
    </Box>
  );
};

export default AdminDashboard;