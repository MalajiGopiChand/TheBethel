import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';

// One manual install dialog for the entire app; the dashboard banner is the reminder.
const PWAInstallPrompt = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(() => window.deferredPrompt || null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState('');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(navigator.userAgent);

  useEffect(() => {
    const requestInstall = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;
      setPrompt(window.deferredPrompt || null);
      setError('');
      setOpen(true);
    };
    const capturePrompt = (event) => {
      event.preventDefault();
      window.deferredPrompt = event;
      setPrompt(event);
    };
    const installed = () => {
      setOpen(false);
      setPrompt(null);
      window.deferredPrompt = null;
    };
    window.addEventListener('pwa-install-request', requestInstall);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('pwa-install-request', requestInstall);
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const close = () => {
    if (installing) return;
    setOpen(false);
    window.showPWAInstall = false;
  };
  const install = async () => {
    if (!prompt) return;
    setInstalling(true);
    setError('');
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') setOpen(false);
    } catch {
      setError('The install prompt could not open. Use the browser instructions below.');
    } finally {
      window.deferredPrompt = null;
      setPrompt(null);
      setInstalling(false);
    }
  };

  const steps = isIOS
    ? ['Open this website in Safari and tap Share.', 'Choose Add to Home Screen.', 'Tap Add to confirm.']
    : isAndroid
      ? ['Open the browser menu (three dots).', 'Choose Install app or Add to Home screen, if available.', 'Confirm to add Bethel AMS to your device.']
      : ['Open the install icon in the address bar or the browser menu.', 'Choose Install app, if available.', 'Confirm to add Bethel AMS to your device.'];

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth aria-labelledby="install-title">
      <DialogTitle id="install-title">Install Bethel AMS</DialogTitle>
      <DialogContent>
        <DialogContentText>Keep attendance, homework, and updates one tap away.</DialogContentText>
        {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
        <Box component="ol" sx={{ pl: 2.5, mb: 0 }}>
          {steps.map((step) => <Typography component="li" variant="body2" key={step} sx={{ mb: 1.5 }}>{step}</Typography>)}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} disabled={installing}>{prompt ? 'Not now' : 'Got it'}</Button>
        {prompt && <Button variant="contained" onClick={install} disabled={installing}>{installing ? 'Installing…' : 'Install app'}</Button>}
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;
