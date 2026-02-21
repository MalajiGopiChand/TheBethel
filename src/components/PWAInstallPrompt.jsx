import React, { useState, useEffect, useRef } from 'react';
import {
  Snackbar,
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  InstallMobile as InstallIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  AddToHomeScreen as AddIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

const PWAInstallPrompt = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);
  const deferredPromptRef = useRef(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    // Detect platform
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const android = /android/i.test(ua);
    
    setIsIOS(iOS);
    setIsAndroid(android);

    // For Android/Chrome - listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      window.deferredPrompt = e;
      setCanInstall(true);
      
      // Show after delay if not already installed and not dismissed
      if (!standalone && !sessionStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    // For iOS - show instructions after delay
    if (iOS && !standalone && !sessionStorage.getItem('pwa-prompt-dismissed')) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Listen for manual install request
    const handleInstallRequest = () => {
      if (iOS) {
        setShowIOSDialog(true);
      } else {
        setShowPrompt(true);
      }
    };
    window.addEventListener('pwa-install-request', handleInstallRequest);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installable (for Android)
    if (!standalone && !iOS && 'serviceWorker' in navigator) {
      // Check if we can install - wait a bit for beforeinstallprompt event
      const checkInstallable = setInterval(() => {
        if (deferredPromptRef.current || window.deferredPrompt) {
          setCanInstall(true);
          clearInterval(checkInstallable);
        }
      }, 500);
      
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkInstallable), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-request', handleInstallRequest);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPromptRef.current || window.deferredPrompt;
    
    if (prompt) {
      try {
        // Show the install prompt
        prompt.prompt();
        
        // Wait for the user to respond
        const choiceResult = await prompt.userChoice;
        
        console.log(`User ${choiceResult.outcome} the install prompt`);
        
        // Clear the deferred prompt
        deferredPromptRef.current = null;
        window.deferredPrompt = null;
        setCanInstall(false);
        setShowPrompt(false);
        
        if (choiceResult.outcome === 'accepted') {
          sessionStorage.setItem('pwa-installed', 'true');
          // The browser will handle the installation
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // Fallback: Show browser menu instructions
        showBrowserMenuInstructions();
      }
    } else {
      // Fallback: Show browser menu instructions
      showBrowserMenuInstructions();
    }
  };

  const showBrowserMenuInstructions = () => {
    if (isAndroid) {
      alert('To install:\n1. Tap the menu (3 dots) in your browser\n2. Select "Install app" or "Add to Home screen"\n3. Tap "Install"');
    } else if (isIOS) {
      setShowIOSDialog(true);
    } else {
      alert('To install this app:\n1. Look for the install icon in your browser address bar\n2. Or check the browser menu for "Install" option');
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    setShowIOSDialog(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Listen for manual show requests
  useEffect(() => {
    const handleManualShow = () => {
      if (isIOS) {
        setShowIOSDialog(true);
      } else {
        setShowPrompt(true);
      }
    };
    window.addEventListener('pwa-install-request', handleManualShow);
    return () => window.removeEventListener('pwa-install-request', handleManualShow);
  }, [isIOS]);

  // Don't show if already dismissed this session or already installed
  if (isStandalone) {
    return null;
  }

  if (!showPrompt && !window.showPWAInstall && !showIOSDialog && (sessionStorage.getItem('pwa-prompt-dismissed') && !window.showPWAInstall)) {
    return null;
  }

  return (
    <>
      {/* Android/Chrome Install Prompt */}
      {!isIOS && (showPrompt || window.showPWAInstall) && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 90, sm: 24 }, zIndex: 1400 }}
          onClose={handleClose}
        >
          <Paper
            elevation={8}
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
              width: '100%'
            }}
          >
            <InstallIcon sx={{ fontSize: 28 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Install Bethel AMS
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.95, display: 'block', lineHeight: 1.4 }}>
                Add to home screen for quick access
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleInstallClick}
              disabled={!canInstall}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontWeight: 'bold',
                px: 2,
                minWidth: 80,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' },
                '&:disabled': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              {canInstall ? 'Install' : 'Menu'}
            </Button>
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
      )}

      {/* iOS Install Instructions Dialog */}
      <Dialog
        open={showIOSDialog || (isIOS && (showPrompt || window.showPWAInstall))}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              Install Bethel AMS
            </Typography>
            <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ color: '#fff', pt: 2 }}>
          <Stepper orientation="vertical" activeStep={-1}>
            <Step>
              <StepLabel 
                StepIconProps={{ sx: { color: '#fff' } }}
                sx={{ '& .MuiStepLabel-label': { color: '#fff', fontWeight: 'bold' } }}
              >
                Tap the Share Button
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
                  Look for the <ShareIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} /> share icon 
                  at the bottom of your Safari browser
                </Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel 
                StepIconProps={{ sx: { color: '#fff' } }}
                sx={{ '& .MuiStepLabel-label': { color: '#fff', fontWeight: 'bold' } }}
              >
                Select "Add to Home Screen"
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
                  Scroll down in the share menu and tap <AddIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} /> 
                  "Add to Home Screen"
                </Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel 
                StepIconProps={{ sx: { color: '#fff' } }}
                sx={{ '& .MuiStepLabel-label': { color: '#fff', fontWeight: 'bold' } }}
              >
                Tap "Add"
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Confirm by tapping "Add" in the top right corner. The app will appear on your home screen!
                </Typography>
              </StepContent>
            </Step>
          </Stepper>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontWeight: 'bold',
                px: 3,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' }
              }}
            >
              Got it!
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* iOS Quick Prompt (Alternative) */}
      {isIOS && !showIOSDialog && (showPrompt || window.showPWAInstall) && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 90, sm: 24 }, zIndex: 1400 }}
          onClose={handleClose}
        >
          <Paper
            elevation={8}
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
              width: '100%'
            }}
          >
            <ShareIcon sx={{ fontSize: 28 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Install App
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.95, display: 'block', lineHeight: 1.4 }}>
                Tap Share <ArrowIcon sx={{ fontSize: 12, verticalAlign: 'middle', mx: 0.5 }} /> 
                then "Add to Home Screen"
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowIOSDialog(true)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontWeight: 'bold',
                px: 2,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' }
              }}
            >
              How?
            </Button>
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
      )}
    </>
  );
};

export default PWAInstallPrompt;
