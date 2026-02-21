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
  Button
} from '@mui/material';
import {
  HomeRounded as HomeIcon,
  AssignmentRounded as HomeworkIcon,
  EmojiEventsRounded as LeaderboardIcon,
  PersonRounded as ProfileIcon,
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

const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentTab, setCurrentTab] = useState(0);
  const [loadingLogout, setLoadingLogout] = useState(false);
  
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
        <HomeTab student={student} />,
        <HomeworkTab student={student} />,
        <LeaderboardTab />,
        <ProfileTab student={student} parentUser={currentUser} />
    ];

    return (
        <Fade in={true} key={currentTab} timeout={300}>
            <Box>
                {tabs[currentTab]}
            </Box>
        </Fade>
    );
  };

  return (
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }
    }}>
      
      {/* Top App Bar - Clean & Modern */}
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.98)', 
            backdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: '1px solid',
            borderColor: 'rgba(102, 126, 234, 0.12)',
            color: 'text.primary',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            mr: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 44, 
            height: 44, 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff', 
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.08) rotate(5deg)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
            }
          }}>
             <ChurchIcon fontSize="small" />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: '800', 
                lineHeight: 1.2, 
                letterSpacing: '-0.02em',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              The Bethel Church
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.25}>
              <Chip 
                label="Parent Portal" 
                size="small" 
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem', 
                  fontWeight: '700',
                  bgcolor: 'rgba(102, 126, 234, 0.08)',
                  color: '#667eea',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  '& .MuiChip-label': {
                    px: 1.5
                  }
                }} 
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.65, 
                  fontWeight: '600',
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {student?.name || currentUser?.name?.split(' ')[0] || 'Guest'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <InstallButton size="small" />
            {isMobile ? (
              <Tooltip title={`Logout (${currentUser?.name || 'User'})`} arrow>
                <Button
                  onClick={handleLogout}
                  disabled={loadingLogout}
                  startIcon={loadingLogout ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.08)', 
                    color: '#667eea',
                    border: '1px solid rgba(102, 126, 234, 0.15)',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    px: 1.5,
                    minWidth: 'auto',
                    '&:hover': { 
                      bgcolor: 'rgba(244, 67, 54, 0.1)', 
                      color: '#f44336',
                      borderColor: 'rgba(244, 67, 54, 0.2)',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {loadingLogout ? '' : (currentUser?.name?.split(' ')[0] || 'User')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Logout" arrow>
                <IconButton 
                    onClick={handleLogout} 
                    disabled={loadingLogout}
                    size="small"
                    sx={{ 
                        bgcolor: 'rgba(102, 126, 234, 0.08)', 
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.15)',
                        width: 40,
                        height: 40,
                        '&:hover': { 
                          bgcolor: 'rgba(244, 67, 54, 0.1)', 
                          color: '#f44336',
                          borderColor: 'rgba(244, 67, 54, 0.2)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {loadingLogout ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, pb: 12, position: 'relative', zIndex: 1 }}> {/* Extra padding for floating nav */}
        <Container maxWidth="md" sx={{ py: 3, px: isMobile ? 2 : 3 }}>
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation (Glassmorphism Dock) */}
      <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={500}>
        <Paper 
          sx={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 1000,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(102, 126, 234, 0.2)',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
          }} 
          elevation={0}
        >
          <Container maxWidth="md" disableGutters>
              <BottomNavigation
              value={currentTab}
              onChange={(event, newValue) => {
                  setCurrentTab(newValue);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showLabels
              sx={{
                  height: 72,
                  bgcolor: 'transparent',
                  '& .MuiBottomNavigationAction-root': {
                      minWidth: 'auto',
                      padding: '8px 0',
                      color: 'text.secondary',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&.Mui-selected': {
                          color: theme.palette.primary.main,
                          transform: 'translateY(-4px)',
                          '& .MuiSvgIcon-root': {
                              fontSize: '1.8rem',
                              filter: `drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4))`,
                              animation: 'pulse 2s infinite'
                          }
                      },
                      '& .MuiSvgIcon-root': {
                          transition: 'all 0.3s',
                          fontSize: '1.6rem',
                          mb: 0.5
                      },
                      '& .MuiBottomNavigationAction-label': {
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          transition: 'all 0.2s',
                          '&.Mui-selected': {
                              fontSize: '0.75rem',
                              fontWeight: '800'
                          }
                      }
                  }
              }}
              >
              <BottomNavigationAction label="Home" icon={<HomeIcon />} />
              <BottomNavigationAction label="Homework" icon={<HomeworkIcon />} />
              <BottomNavigationAction label="Leaderboard" icon={<LeaderboardIcon />} />
              <BottomNavigationAction label="Profile" icon={<ProfileIcon />} />
              </BottomNavigation>
          </Container>
        </Paper>
      </Slide>

      {/* PWA Install Prompt - Cross Platform */}
      <PWAInstallPrompt />
    </Box>
  );
};

export default ParentDashboard;