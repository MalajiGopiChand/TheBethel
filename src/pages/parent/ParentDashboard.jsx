import SchoolLoader from '../../components/SchoolLoader';
import React, { useState, useEffect } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import './parent.css';
import { Box, Container, AppBar, Toolbar, Button, Avatar, Select, MenuItem } from '@mui/material';
import { LogoutRounded as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { doc, collection, query, where, onSnapshot } from '../../services/studentData';
import { db } from '../../config/firebase';


export { default as ParentHome } from './ParentHome';
import { ParentLang, tParent, getParentLang, setParentLang } from '../../utils/parentI18n';

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
  const logoutLabel = parentLang === 'te' ? 'లాగ్ అవుట్' : 'Logout';
  return (
    <Box className="parent-shell parent-portal">
      <AppBar className="portal-header" position="sticky" elevation={0}>
        <Toolbar className="portal-toolbar">
          <Avatar src="/image.png" alt="Bethel" className="portal-logo" />
          <Box className="portal-brand">
            <strong>{tParent(parentLang, 'dashboardTitle')}</strong>
            <span>{student?.name || currentUser?.name}</span>
          </Box>
          <Select size="small" value={parentLang} onChange={event => handleLangChange(event.target.value)}
            inputProps={{ 'aria-label': 'Language / భాష' }} className="portal-language">
            <MenuItem value={ParentLang.EN}>English</MenuItem>
            <MenuItem value={ParentLang.TE}>తెలుగు</MenuItem>
          </Select>
          <Button className="portal-logout" aria-label={logoutLabel} onClick={handleLogout} disabled={loadingLogout}>
            {loadingLogout ? <SchoolLoader /> : <LogoutIcon fontSize="small" />}<span>{logoutLabel}</span>
          </Button>
        </Toolbar>
      </AppBar>
      {dashboard ? outlet : <Container className="portal-subpage" maxWidth="md">{outlet}</Container>}
    </Box>
  );
};
export default ParentDashboard;
