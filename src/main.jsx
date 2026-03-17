import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { lightTheme } from './utils/theme';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/animations.css';
import { registerPushTokenForUser, listenForForegroundPushMessages } from './services/notificationService';
import { useAuth } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <AuthProvider>
          <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <PushBootstrap />
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
</React.StrictMode>
  
);

function PushBootstrap() {
  const { currentUser } = useAuth();

  useEffect(() => {
    // Register web push token once user is known.
    if (!currentUser) return;
    registerPushTokenForUser(currentUser).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    let unsub = () => {};
    listenForForegroundPushMessages().then((u) => {
      unsub = u;
    });
    return () => unsub();
  }, []);

  return null;
}

