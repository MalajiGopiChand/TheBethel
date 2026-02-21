import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  InstallMobile as InstallIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  AddToHomeScreen as AddIcon
} from '@mui/icons-material';

const PWAInstallPrompt = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // For Android/Chrome - listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after delay if not already installed
      if (!standalone) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // For iOS - show instructions after delay
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed this session or already installed
  if (isStandalone || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 90, sm: 24 }, zIndex: 1400 }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: isIOS 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
          width: '100%'
        }}
      >
        {isIOS ? (
          <>
            <ShareIcon sx={{ fontSize: 28 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Install App
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.95, display: 'block', lineHeight: 1.4 }}>
                Tap <AddIcon sx={{ fontSize: 14, verticalAlign: 'middle', mx: 0.5 }} /> then "Add to Home Screen"
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <InstallIcon sx={{ fontSize: 28 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Install App
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.95, display: 'block', lineHeight: 1.4 }}>
                Add to home screen for quick access
              </Typography>
            </Box>
            {deferredPrompt && (
              <Button
                variant="contained"
                size="small"
                onClick={handleInstallClick}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  fontWeight: 'bold',
                  px: 2,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' }
                }}
              >
                Install
              </Button>
            )}
          </>
        )}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ 
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Snackbar>
  );
};

export default PWAInstallPrompt;
