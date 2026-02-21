import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const LeaderboardTab = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper function to calculate dollar points from rewards array
    const calculateDollarPoints = (studentData) => {
      const rewardsList = studentData.rewards || [];
      let calculatedPoints = 0;
      for (const reward of rewardsList) {
        const points = reward.dollars;
        if (typeof points === 'number') {
          calculatedPoints += points;
        } else if (typeof points === 'string') {
          calculatedPoints += parseInt(points) || 0;
        }
      }
      return calculatedPoints > 0 ? calculatedPoints : (studentData.dollarPoints || 0);
    };

    // Real-time listener for leaderboard
    setLoading(true);
    const leaderboardQuery = query(
      collection(db, 'students'),
      orderBy('dollarPoints', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Calculate dollar points from rewards array
        const calculatedPoints = calculateDollarPoints(data);
        return {
          id: doc.id,
          ...data,
          dollarPoints: calculatedPoints
        };
      });
      
      // Sort by calculated points (in case dollarPoints field is outdated)
      studentsData.sort((a, b) => (b.dollarPoints || 0) - (a.dollarPoints || 0));
      
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    // Different colors for other ranks
    const colors = [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#FF9800', // Orange
      '#E91E63', // Pink
      '#00BCD4', // Cyan
      '#795548', // Brown
      '#607D8B', // Blue Grey
      '#FF5722', // Deep Orange
      '#3F51B5'  // Indigo
    ];
    return colors[(rank - 4) % colors.length];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Leaderboard
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {students.map((student, index) => {
          const rank = index + 1;
          return (
            <Card key={student.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ minWidth: 50, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: getRankColor(rank) }}>
                      {getRankIcon(rank)}
                    </Typography>
                    <Typography variant="caption">#{rank}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: getRankColor(rank), color: rank <= 3 ? (rank === 1 ? '#000' : '#fff') : '#fff' }}>
                    {student.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{student.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.classType} • {student.location}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<TrophyIcon />}
                    label={`$${student.dollarPoints || 0}`}
                    sx={{ 
                      bgcolor: getRankColor(rank), 
                      color: rank <= 3 ? (rank === 1 ? '#000' : '#fff') : '#fff',
                      fontWeight: 'bold' 
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default LeaderboardTab;

