import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import {
  LogoutRounded as LogoutIcon,
  InstallMobile as InstallIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const TopBarWithLogout = ({ title, showInstall = false }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loadingLogout, setLoadingLogout] = React.useState(false);

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

  const handleInstall = () => {
    window.showPWAInstall = true;
    window.dispatchEvent(new Event('pwa-install-request'));
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showInstall && (
            <Tooltip title="Install App">
              <IconButton
                onClick={handleInstall}
                sx={{
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea',
                  '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                }}
              >
                <InstallIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              disabled={loadingLogout}
              sx={{
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                color: '#f44336',
                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
              }}
            >
              {loadingLogout ? <CircularProgress size={20} /> : <LogoutIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBarWithLogout;
