import SchoolLoader from '../../components/SchoolLoader';
import React from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, Alert, BottomNavigation, BottomNavigationAction, Paper, Fade } from '@mui/material';
import {
  HomeRounded as HomeIcon,
  HomeOutlined as HomeOutlinedIcon,
  AssignmentRounded as HomeworkIcon,
  AssignmentOutlined as HomeworkOutlinedIcon,
  EmojiEventsRounded as LeaderboardIcon,
  EmojiEventsOutlined as LeaderboardOutlinedIcon,
  PersonRounded as ProfileIcon,
  PersonOutlined as ProfileOutlinedIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';


// Ensure these components exist in your project structure
import HomeTab from './components/HomeTab';
import HomeworkTab from './components/HomeworkTab';
import LeaderboardTab from './components/LeaderboardTab';
import ProfileTab from './components/ProfileTab';
import { ParentLang } from '../../utils/parentI18n';



const tabsByName = ['home', 'homework', 'leaderboard', 'profile'];

const ParentHome = () => {
  const { currentUser } = useAuth();
  const { student, studentError, loadingStudent, parentLang } = useOutletContext();

  const [params, setParams] = useSearchParams();
  const currentTab = Math.max(0, tabsByName.indexOf(params.get('tab')));


  // 3. Render Content Based on Tab
  const renderTabContent = () => {
    if (loadingStudent) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <SchoolLoader />
        </Box>
      );
    }

    if (studentError) return <Alert severity="error">{parentLang === 'te' ? 'విద్యార్థి వివరాలు లోడ్ కాలేదు.' : 'Could not load student details.'}</Alert>;
    if (!student) return <Alert severity="info">{parentLang === 'te' ? 'మీ ఖాతాకు విద్యార్థి లింక్ కాలేదు.' : 'No child is linked to your account.'}</Alert>;

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

  const labels = parentLang === 'te' ? ['హోమ్', 'హోమ్‌వర్క్', 'ర్యాంకులు', 'ప్రొఫైల్'] : ['Home', 'Homework', 'Leaderboard', 'Profile'];
  return (
    <Box>
      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, pb: 12, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="sm" className="portal-content">
          {currentTab > 0 && <Paper className="portal-note" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'info.50' }}>
            <InfoIcon fontSize="small" aria-hidden="true" /><Typography variant="caption" color="text.secondary">
              {parentLang === ParentLang.TE
                ? 'యాప్ ఇన్‌స్టాల్ చేయడానికి ముందు భాషను ఎంచుకోండి. హోమ్‌వర్క్/మెసేజ్ కంటెంట్ మాత్రం టీచర్ పంపిన అసలు భాషలో ఉంటుంది.'
                : 'Choose language before installing app. Homework/message content remains in teacher/admin original language.'}
            </Typography>
          </Paper>}
          {renderTabContent()}
        </Container>
      </Box>

      {/* Bottom Navigation – glass floating dock */}
      <Paper component="nav" aria-label="Parent navigation" className="portal-dock" elevation={0}>
        <BottomNavigation
          value={currentTab}
          onChange={(event, newValue) => {
              if (newValue === currentTab) return;
              setParams(newValue ? { tab: tabsByName[newValue] } : {});
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          showLabels
        >
          <BottomNavigationAction label={labels[0]} icon={currentTab === 0 ? <HomeIcon /> : <HomeOutlinedIcon />} />
          <BottomNavigationAction label={labels[1]} icon={currentTab === 1 ? <HomeworkIcon /> : <HomeworkOutlinedIcon />} />
          <BottomNavigationAction label={labels[2]} icon={currentTab === 2 ? <LeaderboardIcon /> : <LeaderboardOutlinedIcon />} />
          <BottomNavigationAction label={labels[3]} icon={currentTab === 3 ? <ProfileIcon /> : <ProfileOutlinedIcon />} />
        </BottomNavigation>
      </Paper>

    </Box>
  );
};

export default ParentHome;
