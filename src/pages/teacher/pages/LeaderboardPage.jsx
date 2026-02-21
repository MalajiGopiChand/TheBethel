import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Card, CardContent,
  Avatar, Chip, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  EmojiEvents as TrophyIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { handleBackNavigation } from '../../../utils/navigation';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  const calculateTotalDollars = (rewardsList) => {
    if (!rewardsList || !Array.isArray(rewardsList)) return 0;
    return rewardsList.reduce((sum, reward) => sum + (Number(reward.dollars) || 0), 0);
  };

  useEffect(() => {
    const q = query(collection(db, 'students'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown",
          classType: data.classType || "Beginner",
          place: data.place || "Kandrika", 
          dollarPoints: calculateTotalDollars(data.rewards)
        };
      });

      // ✅ Combined Filtering Logic (Class AND Place)
      let filtered = studentsData.filter(s => {
        const matchesClass = selectedClass === 'All' || s.classType === selectedClass;
        
        const matchesPlace = selectedPlace === 'All' ? true :
                             selectedPlace === 'Other' ? !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(s.place) :
                             s.place === selectedPlace;
        
        return matchesClass && matchesPlace;
      });

      // Sort by points
      filtered.sort((a, b) => b.dollarPoints - a.dollarPoints);
      
      setStudents(filtered);
      setLoading(false);
    }, (error) => {
      console.error('Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedPlace]); // Re-run when either filter changes

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
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

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      {/* Header & Filters */}
      <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 0, borderBottom: '3px solid #1976d2' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={3}>
            <Button startIcon={<BackIcon />} onClick={handleBack}>Back</Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
              Bethel Leaderboard
            </Typography>
          </Grid>
          
          {/* Filter Section */}
          <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Area / Place</InputLabel>
              <Select value={selectedPlace} label="Area / Place" onChange={(e) => setSelectedPlace(e.target.value)}>
                {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Podium/List View */}
      <Box sx={{ maxWidth: 700, margin: 'auto', px: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
        ) : students.length === 0 ? (
          <Alert severity="info" variant="filled">No students found in this area/class.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {students.map((student, index) => {
              const rank = index + 1;
              const rankColor = getRankColor(rank);
              
              return (
                <Card key={student.id} sx={{ 
                  borderRadius: 2,
                  boxShadow: rank <= 3 ? 4 : 1,
                  transform: rank <= 3 ? 'scale(1.02)' : 'none',
                  borderLeft: `6px solid ${rankColor}`
                }}>
                  <CardContent sx={{ py: '10px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h5" sx={{ minWidth: 40, fontWeight: 'bold', color: rankColor }}>
                        {getRankIcon(rank)}
                      </Typography>
                      
                      <Avatar sx={{ bgcolor: rankColor, color: rank === 1 ? '#000' : '#fff' }}>
                        {student.name.charAt(0)}
                      </Avatar>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{student.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {student.place} • {student.classType}
                          </Typography>
                        </Box>
                      </Box>

                      <Chip 
                        icon={<TrophyIcon style={{ color: 'white' }} />} 
                        label={`$${student.dollarPoints}`} 
                        sx={{ bgcolor: rankColor, color: rank === 1 ? '#000' : '#fff', fontWeight: 'bold' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LeaderboardPage;