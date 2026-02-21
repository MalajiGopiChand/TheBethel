import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Button, IconButton, useTheme } from '@mui/material';
import { InstallMobile as InstallIcon, Close as CloseIcon } from '@mui/icons-material';

const InstallBanner = () => {
  const theme = useTheme();
  const [show, setShow] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    // Show banner if not installed and not dismissed
    if (!standalone && !localStorage.getItem('install-banner-dismissed')) {
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  const handleInstall = () => {
    window.showPWAInstall = true;
    window.dispatchEvent(new Event('pwa-install-request'));
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('install-banner-dismissed', 'true');
    // Also dismiss the prompt
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    window.showPWAInstall = false;
  };

  if (isStandalone || !show) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none'
        }}
      />
      <InstallIcon sx={{ fontSize: 32, zIndex: 1 }} />
      <Box sx={{ flexGrow: 1, zIndex: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Download Bethel AMS App
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Install on your device for quick access and better experience
        </Typography>
      </Box>
      <Button
        variant="contained"
        onClick={handleInstall}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          color: '#fff',
          fontWeight: 'bold',
          px: 2,
          zIndex: 1,
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' }
        }}
      >
        Install Now
      </Button>
      <IconButton
        size="small"
        onClick={handleDismiss}
        sx={{ color: '#fff', zIndex: 1 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default InstallBanner;
