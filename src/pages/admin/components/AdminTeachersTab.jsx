import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
} from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  Verified as VerifyIcon,
  EmojiEvents as LeaderboardIcon,
  Schedule as ScheduleIcon,
  AssignmentTurnedIn as ReportIcon,
  AccountBalanceWallet as FinanceIcon,
  FamilyRestroom as ParentsIcon
} from '@mui/icons-material';
const AdminTeachersTab = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Verify Teachers',
      subtitle: 'Access',
      icon: <VerifyIcon />,
      colorStart: '#43E97B',
      colorEnd: '#38F9D7',
      isEnabled: true,
      onClick: () => navigate('/admin/verify-teachers')
    },
    
    {
      title: 'Teacher Leaderboard',
      subtitle: 'Rankings',
      icon: <LeaderboardIcon />,
      colorStart: '#FFE53B',
      colorEnd: '#FF2525',
      isEnabled: true,
      onClick: () => navigate('/teacher/teacher-leaderboard')
    },
    {
      title: 'Teacher Schedule',
      subtitle: 'Sunday Schedules',
      icon: <ScheduleIcon />,
      colorStart: '#FF9A9E',
      colorEnd: '#FECFEF',
      isEnabled: true,
      onClick: () => navigate('/teacher/schedule')
    },
    {
      title: 'Report Submission',
      subtitle: 'Attendance reports',
      icon: <ReportIcon />,
      colorStart: '#9BE15D',
      colorEnd: '#00E3AE',
      isEnabled: true,
      onClick: () => navigate('/teacher/report-submission')
    },
    
   
    {
      title: 'Offerings',
      subtitle: 'Finance',
      icon: <FinanceIcon />,
      colorStart: '#2196F3',
      colorEnd: '#03A9F4',
      isEnabled: true,
      onClick: () => navigate('/admin/finance')
    },
    {
      title: 'Parents',
      subtitle: 'Registered',
      icon: <ParentsIcon />,
      colorStart: '#667EEA',
      colorEnd: '#764BA2',
      isEnabled: true,
      onClick: () => navigate('/admin/registered-parents')
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Staff & Parents
      </Typography>

      <ActionGrid actions={actions} />
    </Box>
  );
};

export default AdminTeachersTab;

