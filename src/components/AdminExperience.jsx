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
import '../styles/school-illustrated.css';
import '../styles/desktop-portal.css';
import DesktopPortalNavigation from './DesktopPortalNavigation';
import { isTeacherPendingAccess } from '../utils/teacherVerification';

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
  const interfaceDark = effectiveDarkMode && !!currentUser && !location.pathname.startsWith('/auth');
  const theme = useMemo(() => createTheme(interfaceDark ? darkTheme : lightTheme, {
    palette: interfaceDark ? {} : {
      primary: { main: '#7842e9', dark: '#5d23be', light: '#b690ff' },
      secondary: { main: '#a335ee' },
      text: { primary: '#17152d', secondary: '#5d5b74' },
      background: { default: '#f5f2ff', paper: '#fdfcff' },
      success: { main: '#168866' },
      error: { main: '#d64356' },
    },
    typography: { fontFamily: '"Nunito Sans", "Segoe UI", sans-serif', h4: { fontWeight: 900 }, h5: { fontWeight: 900 }, h6: { fontWeight: 800 }, button: { fontWeight: 800 }, caption: { fontSize: '0.8125rem' } },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 42, borderRadius: 24 }, containedPrimary: { backgroundImage: 'linear-gradient(135deg, #ad80ff, #7944ee 65%, #682ee4)', boxShadow: 'inset 0 2px 3px #ffffff60, 0 5px 12px #8d63ce40' } } },
      MuiPaper: { styleOverrides: { root: { borderRadius: 22 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 16, minHeight: 48 } } },
      MuiDialog: { defaultProps: { fullWidth: true }, styleOverrides: { paper: { borderRadius: 28, fontFamily: '"Nunito Sans", "Segoe UI", sans-serif', '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': { fontFamily: 'inherit' }, background: interfaceDark ? 'linear-gradient(145deg, #30263f, #241d34)' : 'radial-gradient(ellipse at 50% 0%, #e7d8ff, transparent 55%), linear-gradient(145deg, #fff, #f4efff)', border: '1px solid #ffffff', boxShadow: '0 24px 70px #39296140' } } },
      MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.5rem', fontWeight: 800, padding: '24px 24px 16px' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 24px' } } },
      MuiTabs: { defaultProps: { variant: 'fullWidth' } },
      MuiTab: { styleOverrides: { root: { minWidth: 0, fontSize: '0.875rem', padding: '14px 8px', fontWeight: 750 } } },
      MuiAppBar: { styleOverrides: { root: { color: interfaceDark ? '#f6f3ff' : '#222238', backgroundImage: 'none', boxShadow: 'none' } } },
    },
  }), [interfaceDark]);

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
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.getElementById('admin-main')?.animate?.([{ opacity: .4, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'ease-out' });
  }, [location.pathname]);

  const section = adminSection(location.pathname, location.search);
  const showDock = isAdmin && !location.pathname.includes('/messaging');
  const desktopNavigation = ['ADMIN', 'TEACHER', 'PARENT'].includes(currentUser?.role) && !isTeacherPendingAccess(currentUser) && !location.pathname.startsWith('/auth');
  return <ThemeProvider theme={theme}>
    <div data-portal-role={currentUser?.role?.toLowerCase()} className={`admin-experience school-illustrated school-section-${section}${location.pathname === '/admin/dashboard' ? ' school-dashboard' : ''}${location.pathname.startsWith('/auth') || !currentUser ? ' school-auth' : ''}${interfaceDark ? ' admin-dark' : ''}${showDock ? ' has-admin-dock' : ''}${desktopNavigation ? ' has-desktop-navigation' : ''}`}>
      {desktopNavigation && <DesktopPortalNavigation user={currentUser} />}
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
