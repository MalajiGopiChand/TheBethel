import React from 'react';
import { Box, Typography, Avatar, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PodiumSection = ({ topStudents }) => {
  const navigate = useNavigate();

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#9E9E9E';
  };

  const getHeight = (rank) => {
    if (rank === 1) return 170;
    if (rank === 2) return 140;
    if (rank === 3) return 110;
    return 100;
  };

  if (topStudents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">No student data yet</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Top Performers
        </Typography>
        <Button size="small" onClick={() => navigate('/teacher/leaderboard')}>
          View All
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          height: 200,
          gap: 1
        }}
      >
        {topStudents.length > 1 && (
          <PodiumItem
            student={topStudents[1]}
            rank={2}
            height={getHeight(2)}
            color={getRankColor(2)}
            icon={getRankIcon(2)}
          />
        )}
        {topStudents.length > 0 && (
          <PodiumItem
            student={topStudents[0]}
            rank={1}
            height={getHeight(1)}
            color={getRankColor(1)}
            icon={getRankIcon(1)}
          />
        )}
        {topStudents.length > 2 && (
          <PodiumItem
            student={topStudents[2]}
            rank={3}
            height={getHeight(3)}
            color={getRankColor(3)}
            icon={getRankIcon(3)}
          />
        )}
      </Box>
    </Box>
  );
};

const PodiumItem = ({ student, rank, height, color, icon }) => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Avatar
        sx={{
          width: 40,
          height: 40,
          mb: 1,
          border: `2px solid ${color}`,
          bgcolor: 'primary.light',
          color: 'primary.main',
          fontWeight: 'bold'
        }}
      >
        {student.name.charAt(0).toUpperCase()}
      </Avatar>
      
      <Paper
        sx={{
          width: '100%',
          height: height,
          borderRadius: '12px 12px 0 0',
          bgcolor: `${color}33`,
          border: `1px solid ${color}80`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          pb: 1.5
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ color }}>
          {icon}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'center', px: 0.5 }}>
          {student.name}
        </Typography>
        <Typography variant="caption" fontWeight="bold">
          ${student.dollars}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PodiumSection;

