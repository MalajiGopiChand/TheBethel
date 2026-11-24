import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AppBar, Box, Button, CircularProgress, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { LogoutRounded, NotificationsActiveRounded } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_TABS } from '../../utils/adminNavigation';
import AdminHomeTab from './components/AdminHomeTab';
import AdminAttendanceTab from './components/AdminAttendanceTab';
import AdminManageTab from './components/AdminManageTab';
import AdminTeachersTab from './components/AdminTeachersTab';
import AdminMoreTab from './components/AdminMoreTab';
import SchoolArtwork from '../../components/SchoolArtwork';

const content = [AdminHomeTab, AdminAttendanceTab, AdminManageTab, AdminTeachersTab, AdminMoreTab];
export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const index = Math.max(0, ADMIN_TABS.indexOf(params.get('tab') || 'home'));
  const Tab = content[index];
  const handleLogout = async () => {
    setBusy(true);
    try { await logout(); navigate('/auth/admin/login', { replace: true }); }
    catch { setError('Could not log out. Please try again.'); }
    finally { setBusy(false); }
  };
  return <Box className={`admin-page admin-dashboard ${index === 0 ? 'is-home' : ''}`}>
    <AppBar position="static" elevation={0} className="dashboard-hero">
      <Toolbar className="admin-header" sx={{ width: '100%', py: { xs: 2, sm: 3 }, gap: 1 }}>
        <div className="admin-brand">
          <img src="/image.png" alt="Bethel Attendance App" />
          <div className="admin-brand-title">
            <Typography component="h1" variant="h5" sx={{ fontSize: { xs: '1.05rem', sm: '1.8rem' }, lineHeight: 1.2, letterSpacing: '-.025em' }}>Admin Dashboard</Typography>
            <Typography color="text.secondary" sx={{ mt: .5 }}>{currentUser?.name || 'Admin'}</Typography>
          </div>
        </div>
        <Tooltip title="Notification center"><IconButton aria-label="Open notification center" onClick={() => navigate('/admin/notifications')} sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'primary.main' }}><NotificationsActiveRounded /></IconButton></Tooltip>
        <Button color="error" onClick={handleLogout} disabled={busy} startIcon={busy ? <CircularProgress size={16} /> : <LogoutRounded />} sx={{ bgcolor: '#fce7ed', px: { xs: 1.5, sm: 2.5 } }}>Logout</Button>
      </Toolbar>
      {index === 0 && <SchoolArtwork name="hero" className="dashboard-hero-art" />}
    </AppBar>
    <main className="admin-page-content">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box key={index} className="page-section-enter"><Tab /></Box>
    </main>
  </Box>;
}
