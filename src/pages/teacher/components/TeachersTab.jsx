import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
} from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  EmojiEvents as LeaderboardIcon,
  AccountBalanceWallet as OfferingsIcon,
  CalendarMonth as ScheduleIcon,
  AssignmentTurnedIn as ReportIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

const TeachersTab = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'ADMIN' || 
    currentUser?.email === 'gop1@gmail.com' || 
    currentUser?.email === 'premkumartenali@gmail.com';
  const isVerified = currentUser?.isVerified !== false || isAdmin;

  if (!isVerified && !isAdmin) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Teacher features are available after verification.
      </Alert>
    );
  }

  const actions = [
    {
      title: 'Teacher Leaderboard',
      icon: <LeaderboardIcon />,
      colorStart: '#FFE53B',
      colorEnd: '#FF2525',
      isEnabled: true,
      onClick: () => navigate('/teacher/teacher-leaderboard')
    },
    {
      title: 'Teacher Schedule',
      icon: <ScheduleIcon />,
      colorStart: '#FF9A9E',
      colorEnd: '#FECFEF',
      isEnabled: true,
      onClick: () => navigate('/teacher/schedule')
    },
    {
      title: 'Offerings',
      icon: <OfferingsIcon />,
      colorStart: '#FFAB91',
      colorEnd: '#FFCCBC',
      isEnabled: true,
      onClick: () => navigate('/teacher/offerings')
    },
    {
      title: 'Report Submission',
      icon: <ReportIcon />,
      colorStart: '#9BE15D',
      colorEnd: '#00E3AE',
      isEnabled: true,
      onClick: () => navigate('/teacher/report-submission')
    }
  ].filter(action => action.isEnabled);

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Teacher Features
      </Typography>

      <ActionGrid actions={actions} />
    </Box>
  );
};

export default TeachersTab;

