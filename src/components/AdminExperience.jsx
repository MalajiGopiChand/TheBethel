import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Alert, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { DashboardRounded, FactCheckOutlined, ManageAccountsOutlined, SchoolOutlined, SettingsOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../utils/theme';
import { adminSection, adminTabUrl } from '../utils/adminNavigation';
import '../styles/admin.css';

const tabs = [
  ['home', 'Home', <DashboardRounded />],
  ['attendance', 'Attendance', <FactCheckOutlined />],
  ['manage', 'Manage', <ManageAccountsOutlined />],
  ['staff', 'Staff', <SchoolOutlined />],
  ['more', 'More', <SettingsOutlined />],
];

export default function AdminExperience({ children }) {
  const { currentUser } = useAuth();
  const { effectiveDarkMode } = useAppTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [offline, setOffline] = useState(!navigator.onLine);
  const isAdmin = currentUser?.role === 'ADMIN';
  const active = isAdmin || location.pathname === '/auth/admin/login';
  const theme = useMemo(() => createTheme(effectiveDarkMode ? darkTheme : lightTheme, {
    palette: effectiveDarkMode ? {} : {
      primary: { main: '#6659c6', dark: '#4b3ca4', light: '#a49ae5' },
      secondary: { main: '#9475d8' },
      text: { primary: '#222238', secondary: '#656579' },
      background: { default: '#f5f2ff', paper: '#fdfcff' },
      success: { main: '#168866' },
      error: { main: '#d64356' },
    },
    typography: { fontFamily: '"Segoe UI", Roboto, Arial, sans-serif', h4: { fontWeight: 800 }, h5: { fontWeight: 800 }, h6: { fontWeight: 750 }, button: { fontWeight: 700 }, caption: { fontSize: '0.8125rem' } },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 42, borderRadius: 24 }, containedPrimary: { backgroundImage: 'linear-gradient(120deg, #8274d3, #6659c6)', boxShadow: '0 6px 14px #7465bf28' } } },
      MuiPaper: { styleOverrides: { root: { borderRadius: 22 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 16, minHeight: 48 } } },
      MuiDialog: { defaultProps: { fullWidth: true }, styleOverrides: { paper: { borderRadius: 28 } } },
      MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.5rem', fontWeight: 800, padding: '24px 24px 16px' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 24px' } } },
      MuiTabs: { defaultProps: { variant: 'fullWidth' } },
      MuiTab: { styleOverrides: { root: { minWidth: 0, fontSize: '0.875rem', padding: '14px 8px', fontWeight: 750 } } },
      MuiAppBar: { styleOverrides: { root: { color: effectiveDarkMode ? '#f6f3ff' : '#222238', backgroundImage: 'none', boxShadow: 'none' } } },
    },
  }), [effectiveDarkMode]);

  useEffect(() => {
    document.documentElement.dataset.appRole = currentUser?.role || '';
    return () => { delete document.documentElement.dataset.appRole; };
  }, [currentUser?.role]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname, location.search]);

  if (!active) return children;
  const section = adminSection(location.pathname, location.search);
  const showDock = isAdmin && !location.pathname.includes('/messaging');
  return <ThemeProvider theme={theme}>
    <div className={`admin-experience${effectiveDarkMode ? ' admin-dark' : ''}${showDock ? ' has-admin-dock' : ''}`}>
      <a className="admin-skip-link" href="#admin-main">Skip to content</a>
      {offline && <Alert severity="warning">You’re offline. Reconnect before saving changes. Previously loaded information may be out of date.</Alert>}
      <div id="admin-main" tabIndex={-1}>{children}</div>
      {showDock && <Paper component="nav" aria-label="Admin navigation" className="admin-dock" elevation={0}>
        <BottomNavigation showLabels value={section} onChange={(_, tab) => navigate(adminTabUrl(tab))}>
          {tabs.map(([value, label, icon]) => <BottomNavigationAction key={value} value={value} label={label} icon={icon} aria-current={value === section ? 'page' : undefined} />)}
        </BottomNavigation>
      </Paper>}
    </div>
  </ThemeProvider>;
}
