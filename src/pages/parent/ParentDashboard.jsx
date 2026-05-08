import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Avatar,
  Tooltip,
  Slide,
  Chip,
  Snackbar,
  Button,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  HomeOutlined as HomeOutlinedIcon,
  AssignmentRounded as HomeworkIcon,
  AssignmentOutlined as HomeworkOutlinedIcon,
  EmojiEventsRounded as LeaderboardIcon,
  EmojiEventsOutlined as LeaderboardOutlinedIcon,
  PersonRounded as ProfileIcon,
  PersonOutlined as ProfileOutlinedIcon,
  LogoutRounded as LogoutIcon,
  Church as ChurchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';
import InstallButton from '../../components/InstallButton';

// Ensure these components exist in your project structure
import HomeTab from './components/HomeTab';
import HomeworkTab from './components/HomeworkTab';
import LeaderboardTab from './components/LeaderboardTab';
import ProfileTab from './components/ProfileTab';
import { ParentLang, getParentLang, setParentLang, tParent } from '../../utils/parentI18n';

const PARENT_TOUR_KEY = 'parent_tour_seen_v1';

const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = sessionStorage.getItem('ParentDashboard_currentTab');
    return savedTab ? parseInt(savedTab, 10) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem('ParentDashboard_currentTab', currentTab.toString());
  }, [currentTab]);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [parentLang, setParentLangState] = useState(() => getParentLang());
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  
  // Student Data State
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);


  // 1. Fetch Student Data Real-time
  useEffect(() => {
    if (!currentUser?.studentId) {
      setStudent(null);
      setLoadingStudent(false);
      return;
    }

    setLoadingStudent(true);
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
      console.error('Error fetching student data:', error);
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

    const tabs = [
        <HomeTab student={student} parentLang={parentLang} />,
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

  useEffect(() => {
    const seen = localStorage.getItem(PARENT_TOUR_KEY);
    if (!seen) setShowTour(true);
  }, []);

  const tourSteps = [
    parentLang === ParentLang.TE ? 'హోమ్' : 'Home',
    parentLang === ParentLang.TE ? 'హోమ్‌వర్క్' : 'Homework',
    parentLang === ParentLang.TE ? 'లీడర్‌బోర్డ్' : 'Leaderboard',
    parentLang === ParentLang.TE ? 'ప్రొఫైల్' : 'Profile'
  ];

  const closeTour = () => {
    localStorage.setItem(PARENT_TOUR_KEY, '1');
    setShowTour(false);
    setTourStep(0);
  };

  return (
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        position: 'relative'
    }}>
      
      {/* Top App Bar - Matched to Teacher Dashboard UI */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backgroundImage: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(22px)',
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'rgba(15,23,42,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 30px rgba(15,23,42,0.55)',
              }}
            >
              <Box
                component="img"
                src="/image.png"
                alt="Bethel AMS"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.03em', color: '#000' }}>
                {tParent(parentLang, 'dashboardTitle')}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#000' }}>
                {student?.name || currentUser?.name || 'Guest'}
              </Typography>
            </Box>
          </Box>

          {/* Mobile-first header actions (used for all screen sizes) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 95 }}>
              <Select
                value={parentLang}
                onChange={(e) => handleLangChange(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: '#fff' }}
              >
                <MenuItem value={ParentLang.TE}>తెలుగు</MenuItem>
                <MenuItem value={ParentLang.EN}>English</MenuItem>
              </Select>
            </FormControl>
            <InstallButton size="small" />
            <Tooltip title={`Logout (${currentUser?.name || 'User'})`}>
              <Button
                onClick={handleLogout}
                disabled={loadingLogout}
                sx={{
                  minWidth: 'auto',
                  p: '6px 12px',
                  color: '#d32f2f',
                  borderRadius: 2,
                  bgcolor: 'rgba(211,47,47,0.08)',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
                startIcon={!loadingLogout && <LogoutIcon sx={{ width: 18, height: 18 }} />}
              >
                {loadingLogout ? <CircularProgress size={16} color="inherit" /> : 'Logout'}
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, pb: 12, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="sm" sx={{ py: 2.5, px: 2 }}>
          <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'info.50' }}>
            <Typography variant="caption" color="text.secondary">
              {parentLang === ParentLang.TE
                ? 'యాప్ ఇన్‌స్టాల్ చేయడానికి ముందు భాషను ఎంచుకోండి. హోమ్‌వర్క్/మెసేజ్ కంటెంట్ మాత్రం టీచర్ పంపిన అసలు భాషలో ఉంటుంది.'
                : 'Choose language before installing app. Homework/message content remains in teacher/admin original language.'}
            </Typography>
          </Paper>
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation – glass floating dock */}
      <Paper
        className="page-card-enter"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          borderRadius: 999,
          bgcolor: 'rgba(15,23,42,0.96)',
          backdropFilter: 'blur(24px)',
          px: 1,
          boxShadow: '0 22px 60px rgba(15,23,42,0.9)',
          width: '92%',
          maxWidth: 620,
        }}
        elevation={0}
      >
        <BottomNavigation
          value={currentTab}
          onChange={(event, newValue) => {
              setCurrentTab(newValue);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          showLabels
          sx={{
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '8px 6px',
              color: 'rgba(148,163,184,0.75)',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
              '& .MuiSvgIcon-root': {
                transition: 'all 0.25s ease',
              },
              '&.Mui-selected .MuiSvgIcon-root': {
                transform: 'translateY(-3px) scale(1.15)',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: 11,
                fontWeight: 600,
              },
            },
          }}
        >
          <BottomNavigationAction label="Home" icon={currentTab === 0 ? <HomeIcon /> : <HomeOutlinedIcon />} />
          <BottomNavigationAction label="Homework" icon={currentTab === 1 ? <HomeworkIcon /> : <HomeworkOutlinedIcon />} />
          <BottomNavigationAction label="Leaderboard" icon={currentTab === 2 ? <LeaderboardIcon /> : <LeaderboardOutlinedIcon />} />
          <BottomNavigationAction label="Profile" icon={currentTab === 3 ? <ProfileIcon /> : <ProfileOutlinedIcon />} />
        </BottomNavigation>
      </Paper>

      {/* PWA Install Prompt - Cross Platform */}
      <PWAInstallPrompt />

      <Dialog open={showTour} onClose={closeTour} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {parentLang === ParentLang.TE ? 'యాప్ టూర్' : 'App Tour'}
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={tourStep} alternativeLabel sx={{ mb: 2 }}>
            {tourSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            {tourStep === 0 && (
              <Typography variant="body2">
                {parentLang === ParentLang.TE
                  ? 'ఇక్కడ మీ పిల్లవాడి హాజరు, పాయింట్లు, ముఖ్య సమాచారం చూస్తారు.'
                  : 'See your child attendance, points and important updates here.'}
              </Typography>
            )}
            {tourStep === 1 && (
              <Typography variant="body2">
                {parentLang === ParentLang.TE
                  ? 'హోమ్‌వర్క్ ట్యాబ్‌లో తాజా అసైన్‌మెంట్లు ఉంటాయి. పాత వారపు హోమ్‌వర్క్ ఆదివారం తర్వాత కనిపించదు.'
                  : 'Homework tab shows current assignments. Previous-week homework is hidden after Sunday.'}
              </Typography>
            )}
            {tourStep === 2 && (
              <Typography variant="body2">
                {parentLang === ParentLang.TE
                  ? 'లీడర్‌బోర్డ్‌లో మీ ప్రాంతంలోని ర్యాంక్ చూడండి.'
                  : 'See your area rank in the leaderboard.'}
              </Typography>
            )}
            {tourStep === 3 && (
              <Typography variant="body2">
                {parentLang === ParentLang.TE
                  ? 'ప్రొఫైల్‌లో వివరాలు చూడండి. భాషను పైభాగంలో మార్చవచ్చు.'
                  : 'Check profile and switch language from the top.'}
              </Typography>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTour} color="inherit">
            {parentLang === ParentLang.TE ? 'దాటవేయి' : 'Skip'}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={() => setTourStep((s) => Math.max(0, s - 1))}
            disabled={tourStep === 0}
            color="inherit"
          >
            {parentLang === ParentLang.TE ? 'వెనుక' : 'Back'}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (tourStep >= tourSteps.length - 1) closeTour();
              else setTourStep((s) => s + 1);
            }}
          >
            {tourStep >= tourSteps.length - 1
              ? (parentLang === ParentLang.TE ? 'ముగింపు' : 'Finish')
              : (parentLang === ParentLang.TE ? 'తదుపరి' : 'Next')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentDashboard;