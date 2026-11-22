import ActivityPeriodProvider from './contexts/ActivityPeriodContext';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/animations.css';
import { registerPushTokenForUser, listenForForegroundPushMessages } from './services/notificationService';
import { useAuth } from './contexts/AuthContext';
import { retryNotifications } from './services/notificationRelay';

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <AuthProvider>
          <ThemeContextProvider>
            <CssBaseline />
            <PushBootstrap />
            <ActivityPeriodProvider><App /></ActivityPeriodProvider>
          </ThemeContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
</React.StrictMode>
  
);

function PushBootstrap() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    void retryNotifications();
    const timer = setInterval(() => { void retryNotifications(); }, 30000);
    const online = () => { void retryNotifications(); };
    window.addEventListener('online', online);
    return () => { clearInterval(timer); window.removeEventListener('online', online); };
  }, [currentUser?.uid]);

  useEffect(() => {
    // Register web push token once user is known.
    if (!currentUser) return;
    registerPushTokenForUser(currentUser).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    let unsub = () => {};
    let disposed = false;
    listenForForegroundPushMessages().then((stop) => {
      if (disposed) stop(); else unsub = stop;
    }).catch(() => {});
    return () => { disposed = true; unsub(); };
  }, []);

  return null;
}

