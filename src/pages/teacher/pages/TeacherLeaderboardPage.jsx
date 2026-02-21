import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Avatar,
  useTheme,
  Container
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase'; // Adjust path based on your folder structure
import { handleBackNavigation } from '../../../utils/navigation';

const TeacherLeaderboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'teacherProgress'));
        const rawData = querySnapshot.docs.map(doc => doc.data());

        // Logic: Group by teacherName and Sum points (Matches your Kotlin code)
        const groupedData = rawData.reduce((acc, curr) => {
          const name = curr.teacherName || 'Unknown';
          const points = parseInt(curr.points) || 0;

          if (!acc[name]) {
            acc[name] = { teacherName: name, totalPoints: 0 };
          }
          acc[name].totalPoints += points;
          return acc;
        }, {});

        // Convert to array and Sort descending
        const sortedLeaders = Object.values(groupedData).sort((a, b) => b.totalPoints - a.totalPoints);

        setLeaders(sortedLeaders);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Helper component for the Top 3 Podium
  const PodiumSpot = ({ teacher, rank }) => {
    if (!teacher) return <Box sx={{ flex: 1 }} />;

    let bgColor, height, iconColor, scale;

    switch (rank) {
      case 1:
        bgColor = '#FFD700'; // Gold
        height = 180;
        iconColor = '#B8860B';
        scale = 1.1;
        break;
      case 2:
        bgColor = '#C0C0C0'; // Silver
        height = 150;
        iconColor = '#757575';
        scale = 1.0;
        break;
      case 3:
        bgColor = '#CD7F32'; // Bronze
        height = 120;
        iconColor = '#8B4513';
        scale = 0.95;
        break;
      default:
        bgColor = '#fff';
        height = 100;
    }

    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: rank === 1 ? 2 : 1,
          transform: `scale(${scale})`,
          mx: 0.5
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          sx={{ mb: 1, color: rank === 1 ? theme.palette.warning.main : 'text.secondary' }}
        >
          #{rank}
        </Typography>
        
        <Paper
          elevation={rank === 1 ? 8 : 3}
          sx={{
            width: '100%',
            height: `${height}px`,
            bgcolor: bgColor,
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
           {/* Decorative shine effect */}
           <Box sx={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 60%)',
              pointerEvents: 'none'
           }} />

          <TrophyIcon sx={{ fontSize: 30, color: '#fff', mb: 1, filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }} />
          
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.2, mb: 0.5 }}
          >
            {teacher.teacherName}
          </Typography>
          
          <Typography variant="h6" fontWeight="900" sx={{ color: '#000' }}>
            {teacher.totalPoints}
          </Typography>
          <Typography variant="caption" sx={{ color: '#444' }}>pts</Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 800, mx: 'auto' }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Teacher Leaderboard
          </Typography>
          <Box sx={{ width: 80 }} /> {/* Spacer to center title */}
        </Box>
      </Paper>

      <Container maxWidth="sm">
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : leaders.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">No data available yet.</Typography>
          </Box>
        ) : (
          <>
            {/* Podium Section (Top 3) */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'center', 
              mb: 4, 
              mt: 2,
              px: 2
            }}>
              {/* Order: 2nd, 1st, 3rd to match visual podium style */}
              <PodiumSpot teacher={leaders[1]} rank={2} />
              <PodiumSpot teacher={leaders[0]} rank={1} />
              <PodiumSpot teacher={leaders[2]} rank={3} />
            </Box>

            {/* List Section (Rank 4+) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {leaders.slice(3).map((teacher, index) => {
                const rank = index + 4;
                const getRankColor = (rank) => {
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
                const rankColor = getRankColor(rank);
                return (
                  <Card 
                    key={rank} 
                    elevation={1} 
                    sx={{ 
                      borderRadius: 3,
                      transition: 'transform 0.1s',
                      borderLeft: `4px solid ${rankColor}`,
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                  >
                    <CardContent sx={{ 
                        p: '16px !important', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: rankColor,
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 'bold',
                            mr: 2
                          }}
                        >
                          {rank}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {teacher.teacherName}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                         <StarIcon sx={{ color: rankColor, fontSize: 18, mr: 0.5 }} />
                         <Typography variant="h6" fontWeight="bold" sx={{ color: rankColor }}>
                           {teacher.totalPoints}
                         </Typography>
                         <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5, mt: 0.5 }}>
                            pts
                         </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default TeacherLeaderboardPage;