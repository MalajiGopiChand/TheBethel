import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  CalendarToday as ScheduleIcon,
  TrendingUp as ProgressIcon,
  Badge as AttendanceIcon
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
      title: 'Schedules',
      icon: <ScheduleIcon />,
      colorStart: '#EF9A9A',
      colorEnd: '#FFCDD2',
      isEnabled: isAdmin,
      onClick: () => navigate('/admin/timetable')
    },
    {
      title: 'Teacher Schedule',
      icon: <ProgressIcon />,
      colorStart: '#A8EDEA',
      colorEnd: '#FED6E3',
      isEnabled: true,
      onClick: () => navigate('/teacher/schedule')
    },
    {
      title: 'Offerings',
      icon: <AttendanceIcon />,
      colorStart: '#FFAB91',
      colorEnd: '#FFCCBC',
      isEnabled: true,
      onClick: () => navigate('/teacher/offerings')
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

