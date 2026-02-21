import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Badge, useMediaQuery, useTheme } from '@mui/material';
import { InstallMobile as InstallIcon } from '@mui/icons-material';

const InstallButton = ({ size = 'medium', variant = 'icon' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    // Check for deferred prompt
    const checkInstallable = () => {
      if (window.deferredPrompt) {
        setCanInstall(true);
      }
    };

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check immediately and periodically
    checkInstallable();
    const interval = setInterval(checkInstallable, 1000);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(interval);
    };
  }, []);

  const handleInstallClick = () => {
    // Trigger the install prompt
    window.showPWAInstall = true;
    window.dispatchEvent(new Event('pwa-install-request'));
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <Tooltip title={canInstall ? "Install App" : "Download App"}>
        <IconButton
          onClick={handleInstallClick}
          size={size}
          sx={{
            bgcolor: canInstall ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
            color: '#667eea',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            '&:hover': { 
              bgcolor: 'rgba(102, 126, 234, 0.2)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s'
          }}
        >
          <Badge 
            variant="dot" 
            color="success" 
            invisible={!canInstall}
            sx={{
              '& .MuiBadge-badge': {
                right: 2,
                top: 2,
              }
            }}
          >
            <InstallIcon fontSize={size === 'small' ? 'small' : 'medium'} />
          </Badge>
        </IconButton>
      </Tooltip>
    );
  }

  return null;
};

export default InstallButton;
