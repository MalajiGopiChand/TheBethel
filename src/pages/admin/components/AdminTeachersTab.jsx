import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  Verified as VerifyIcon,
  TrendingUp as ProgressIcon,
  EmojiEvents as LeaderboardIcon,
  Schedule as ScheduleIcon,
  AssignmentTurnedIn as ReportIcon,
  AccountBalanceWallet as FinanceIcon,
  FamilyRestroom as ParentsIcon
} from '@mui/icons-material';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const AdminTeachersTab = () => {
  const navigate = useNavigate();
  const [teacherStats, setTeacherStats] = useState({ total: 0, verified: 0 });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const teachers = snapshot.docs.map((d) => d.data());
      const verified = teachers.filter((t) => t.isVerified).length;
      setTeacherStats({
        total: teachers.length,
        verified,
      });
    });

    const unsubLeaderboard = onSnapshot(collection(db, 'teacherProgress'), (snapshot) => {
      const grouped = snapshot.docs.reduce((acc, docRef) => {
        const data = docRef.data();
        const name = data.teacherName || 'Unknown';
        const points = parseInt(data.points, 10) || 0;
        acc[name] = (acc[name] || 0) + points;
        return acc;
      }, {});

      const top = Object.entries(grouped)
        .map(([teacherName, totalPoints]) => ({ teacherName, totalPoints }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 5);

      setLeaderboard(top);
    });

    return () => {
      unsubTeachers();
      unsubLeaderboard();
    };
  }, []);

  const verificationPercent = useMemo(() => {
    if (!teacherStats.total) return 0;
    return Math.round((teacherStats.verified / teacherStats.total) * 100);
  }, [teacherStats]);

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

      <Stack spacing={2} sx={{ mb: 2.5 }}>
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Teacher Verification Progress
            </Typography>
            <Chip label={`${verificationPercent}%`} color="primary" size="small" />
          </Box>
          <LinearProgress variant="determinate" value={verificationPercent} sx={{ height: 10, borderRadius: 999 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {teacherStats.verified} of {teacherStats.total} teachers verified
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Teacher Leaderboard
            </Typography>
            <Chip label="Top 5" size="small" />
          </Box>
          {leaderboard.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No leaderboard data yet.
            </Typography>
          ) : (
            <List dense disablePadding>
              {leaderboard.map((item, idx) => (
                <ListItem key={`${item.teacherName}-${idx}`} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 600 }}
                    primary={`${idx + 1}. ${item.teacherName}`}
                    secondary={`${item.totalPoints} pts`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Stack>

      <ActionGrid actions={actions} />
    </Box>
  );
};

export default AdminTeachersTab;

