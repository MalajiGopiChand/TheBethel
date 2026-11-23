import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './parent.css';
import { Alert, Box, Container, AppBar, Toolbar, Typography, IconButton, BottomNavigation, BottomNavigationAction, Paper, CircularProgress, Fade, Avatar, Tooltip, Select, MenuItem } from '@mui/material';
import { HomeOutlined as HomeOutlinedIcon, AssignmentOutlined as HomeworkOutlinedIcon, EmojiEventsOutlined as LeaderboardOutlinedIcon, PersonOutlined as ProfileOutlinedIcon, LogoutRounded as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from '../../services/studentData';
import { db } from '../../config/firebase';


// Ensure these components exist in your project structure
import HomeTab from './components/HomeTab';
import HomeworkTab from './components/HomeworkTab';
import LeaderboardTab from './components/LeaderboardTab';
import ProfileTab from './components/ProfileTab';
import { ParentLang, getParentLang, setParentLang, tParent } from '../../utils/parentI18n';



const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = sessionStorage.getItem('ParentDashboard_currentTab');
    const value = Number(savedTab);
    return Number.isInteger(value) && value >= 0 && value < 4 ? value : 0;
  });

  useEffect(() => {
    sessionStorage.setItem('ParentDashboard_currentTab', currentTab.toString());
  }, [currentTab]);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [parentLang, setParentLangState] = useState(() => getParentLang());

  
  // Student Data State
  const [student, setStudent] = useState(null);
  const [studentError, setStudentError] = useState('');
  const [loadingStudent, setLoadingStudent] = useState(true);


  // 1. Fetch Student Data Real-time
  useEffect(() => {
    if (!currentUser?.studentId) {
      setStudent(null);
      setLoadingStudent(false);
      return;
    }

    setLoadingStudent(true);
    setStudentError('');
    const studentsQuery = query(
      collection(db, 'students'),
      where('studentId', '==', currentUser.studentId)
    );
    
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();
        
        // --- POINTS CALCULATION FIX ---
        const rewardsList = studentData.rewards || [];
        let calculatedPoints = 0;
        
        if (Array.isArray(rewardsList)) {
            rewardsList.forEach(reward => {
                const points = reward?.dollars;
                if (typeof points === 'number') {
                    calculatedPoints += points;
                } else if (typeof points === 'string') {
                    calculatedPoints += parseInt(points) || 0;
                }
            });
        }
        
        const finalPoints = calculatedPoints > 0 ? calculatedPoints : (studentData.dollarPoints || 0);
        
        setStudent({
          id: studentDoc.id,
          ...studentData,
          dollarPoints: finalPoints
        });
      } else {
        setStudent(null);
      }
      setLoadingStudent(false);
    }, (error) => {
      setStudent(null);
      setStudentError(parentLang === 'te' ? 'విద్యార్థి వివరాలు లోడ్ కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Could not load student details. Please reload or contact the school.');
      setLoadingStudent(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  // 3. Render Content Based on Tab
  const renderTabContent = () => {
    if (loadingStudent) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} thickness={4} />
        </Box>
      );
    }

    if (studentError) return <Alert severity="error">{studentError}</Alert>;
    const tabs = [
        <HomeTab student={student} parentLang={parentLang} onSelectTab={setCurrentTab} />,
        <HomeworkTab student={student} parentLang={parentLang} />,
        <LeaderboardTab student={student} parentLang={parentLang} />,
        <ProfileTab student={student} parentUser={currentUser} parentLang={parentLang} />
    ];

    return (
        <Fade in={true} key={currentTab} timeout={300}>
            <Box>
                {tabs[currentTab]}
            </Box>
        </Fade>
    );
  };

  const handleLangChange = (lang) => {
    setParentLangState(lang);
    setParentLang(lang);
  };

  return (
    <Box className="parent-shell" sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', backdropFilter: 'blur(16px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ width: '100%', maxWidth: 1040, mx: 'auto', boxSizing: 'border-box', py: 1, gap: 1 }}>
          <Avatar src="/image.png" alt="The Bethel" variant="rounded" sx={{ width: 38, height: 38, borderRadius: 2 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={800} sx={{ letterSpacing: '-.03em', fontSize: 18 }}>The Bethel</Typography><Typography variant="caption" color="text.secondary">{parentLang === 'te' ? 'తల్లిదండ్రుల పోర్టల్' : 'Parent portal'}</Typography></Box>
          <Select size="small" value={parentLang} onChange={event => handleLangChange(event.target.value)} inputProps={{ 'aria-label': 'Language / భాష' }} sx={{ fontSize: 13, borderRadius: 2, '& .MuiSelect-select': { py: 1 } }}><MenuItem value={ParentLang.TE}>తెలుగు</MenuItem><MenuItem value={ParentLang.EN}>English</MenuItem></Select>
          <Tooltip title={parentLang === 'te' ? 'లాగ్ అవుట్' : 'Sign out'}><span><IconButton aria-label="Sign out" onClick={handleLogout} disabled={loadingLogout} sx={{ color: 'primary.main' }}>{loadingLogout ? <CircularProgress size={20} /> : <LogoutIcon fontSize="small" />}</IconButton></span></Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ pt: { xs: 2.5, sm: 4 }, pb: 'calc(110px + env(safe-area-inset-bottom))', px: { xs: 2, sm: 3 } }}>
        {renderTabContent()}
      </Container>
      <Paper elevation={0} sx={{ position: 'fixed', bottom: 'calc(12px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: 'calc(100% - 24px)', maxWidth: 580, borderRadius: 4, border: '1px solid #334155', boxShadow: '0 12px 32px #0f172a30', bgcolor: 'rgba(15,23,42,0.96)', backdropFilter: 'blur(16px)', overflow: 'hidden' }}>
        <BottomNavigation value={currentTab} showLabels onChange={(_, value) => { setCurrentTab(value); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }} sx={{ height: 68, bgcolor: 'transparent', '& .MuiBottomNavigationAction-root': { minWidth: 0, color: '#cbd5e1', gap: .5, '&.Mui-selected': { color: '#fff', bgcolor: 'rgba(76,111,255,0.25)' } }, '& .MuiBottomNavigationAction-label': { fontSize: 11, fontWeight: 700, '&.Mui-selected': { fontSize: 11 } } }}>
          <BottomNavigationAction label={parentLang === 'te' ? 'హోమ్' : 'Home'} icon={<HomeOutlinedIcon />} />
          <BottomNavigationAction label={parentLang === 'te' ? 'హోమ్‌వర్క్' : 'Homework'} icon={<HomeworkOutlinedIcon />} />
          <BottomNavigationAction label={parentLang === 'te' ? 'ర్యాంకులు' : 'Leaderboard'} icon={<LeaderboardOutlinedIcon />} />
          <BottomNavigationAction label={parentLang === 'te' ? 'ప్రొఫైల్' : 'Profile'} icon={<ProfileOutlinedIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
export default ParentDashboard;
