import React, { useState, useEffect } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import './parent.css';
import { Box, Container, AppBar, Toolbar, Typography, IconButton, CircularProgress, Avatar, Tooltip, Select, MenuItem } from '@mui/material';
import { LogoutRounded as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { doc, collection, query, where, onSnapshot } from '../../services/studentData';
import { db } from '../../config/firebase';


export { default as ParentHome } from './ParentHome';
import { ParentLang, getParentLang, setParentLang } from '../../utils/parentI18n';
import { alpha } from '@mui/material/styles';

const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const dashboard = useMatch("/parent/dashboard");

  
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [parentLang, setParentLangState] = useState(() => getParentLang());

  
  // Student Data State
  const [student, setStudent] = useState(null);
  const [studentError, setStudentError] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(true);


  // 1. Fetch Student Data Real-time
  useEffect(() => {
    if (!currentUser?.studentId) {
      setStudent(null);
      setLoadingStudent(false);
      return;
    }

    setLoadingStudent(true);
    setStudentError(false);
    const studentsQuery = query(
      collection(db, 'students'),
      where('studentId', '==', currentUser.studentId)
    );
    
    let stopFallback;
    const receive = snapshot => {
      const data = snapshot?.data();
      const rewards = Array.isArray(data?.rewards) ? data.rewards : [];
      const points = rewards.reduce((sum, reward) => sum + (Number(reward?.dollars) || 0), 0);
      setStudent(data ? { ...data, id: snapshot.id, dollarPoints: points > 0 ? points : data.dollarPoints || 0 } : null);
      setStudentError(false);
      setLoadingStudent(false);
    };
    const failed = () => {
      setStudent(null);
      setStudentError(true);
      setLoadingStudent(false);
    };
    const unsubscribe = onSnapshot(studentsQuery, snapshot => {
      stopFallback?.();
      stopFallback = undefined;
      if (snapshot.empty) {
        stopFallback = onSnapshot(doc(db, 'students', currentUser.studentId), receive, failed);
      } else {
        receive(snapshot.docs[0]);
      }
    }, failed);
    return () => {
      unsubscribe();
      stopFallback?.();
    };
  }, [currentUser?.studentId]);

  // 2. Handle Logout
  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoadingLogout(false);
    }
  };

  const handleLangChange = (lang) => {
    setParentLangState(lang);
    setParentLang(lang);
  };

  const outlet = <Outlet context={{ student, studentError, loadingStudent, parentLang, handleLangChange, handleLogout, loadingLogout }} />;
  if (dashboard) return outlet;

  return (
    <Box className="parent-shell" sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
      <AppBar position="sticky" elevation={0} sx={theme => ({ bgcolor: alpha(theme.palette.background.paper, .78), backgroundImage: 'linear-gradient(180deg, #ffffff25, transparent)', color: 'text.primary', backdropFilter: 'saturate(150%) blur(22px)', borderBottom: '1px solid', borderColor: 'divider', boxShadow: '0 3px 16px #0f172a0c' })}>
        <Toolbar sx={{ width: '100%', maxWidth: 1040, mx: 'auto', boxSizing: 'border-box', py: 1, gap: 1 }}>
          <Avatar src="/image.png" alt="The Bethel" variant="rounded" sx={{ width: 38, height: 38, borderRadius: 2 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={800} sx={{ letterSpacing: '-.03em', fontSize: 18 }}>The Bethel</Typography><Typography variant="caption" color="text.secondary">{parentLang === 'te' ? 'తల్లిదండ్రుల పోర్టల్' : 'Parent portal'}</Typography></Box>
          <Select size="small" value={parentLang} onChange={event => handleLangChange(event.target.value)} inputProps={{ 'aria-label': 'Language / భాష' }} sx={{ fontSize: 13, borderRadius: 2, '& .MuiSelect-select': { py: 1 } }}><MenuItem value={ParentLang.TE}>తెలుగు</MenuItem><MenuItem value={ParentLang.EN}>English</MenuItem></Select>
          <Tooltip title={parentLang === 'te' ? 'లాగ్ అవుట్' : 'Sign out'}><span><IconButton aria-label="Sign out" onClick={handleLogout} disabled={loadingLogout} sx={{ color: 'primary.main' }}>{loadingLogout ? <CircularProgress size={20} /> : <LogoutIcon fontSize="small" />}</IconButton></span></Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ pt: { xs: 2.5, sm: 4 }, pb: 'calc(32px + env(safe-area-inset-bottom))', px: { xs: 2, sm: 3 } }}>
        {outlet}
      </Container>

    </Box>
  );
};
export default ParentDashboard;
