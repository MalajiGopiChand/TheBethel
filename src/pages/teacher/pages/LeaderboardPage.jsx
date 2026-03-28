import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Fade, Grow, Stack,
  Box, Paper, Typography, Card, CardContent,
  Avatar, Chip, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Grid, Alert, Container
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

  // Duolingo-style Floating Avatar Podium Helper for Students
  const FloatingPodium = ({ topStudents }) => {
    if (!topStudents || topStudents.length === 0) return null;
    
    // Order needs to be 2, 1, 3 for rendering visually.
    const podiumOrder = [
        { rank: 2, student: topStudents[1] },
        { rank: 1, student: topStudents[0] },
        { rank: 3, student: topStudents[2] }
    ];

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: {xs: 2, sm: 4}, mt: 6, mb: 4 }}>
            {podiumOrder.map((item) => {
                if (!item.student) return <Box key={`empty-${item.rank}`} sx={{ width: 80 }} />;
                
                const isFirst = item.rank === 1;
                const size = isFirst ? 110 : 80;
                const colors = {
                    1: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', // Gold
                    2: 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)', // Silver
                    3: 'linear-gradient(135deg, #FDBA74 0%, #C2410C 100%)'  // Bronze
                };
                const shadowColors = { 1: '#F59E0B', 2: '#9CA3AF', 3: '#C2410C' };
                const bgGradient = colors[item.rank];
                const shadowCol = shadowColors[item.rank];

                return (
                    <Fade in={true} timeout={item.rank * 400} key={item.rank}>
                        <Box sx={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', 
                            position: 'relative',
                            transform: isFirst ? 'translateY(-30px)' : 'none',
                            zIndex: isFirst ? 10 : 1
                        }}>
                            {/* Crown for 1st */}
                            {isFirst && (
                                <Box sx={{ 
                                    position: 'absolute', top: -38, zIndex: 12,
                                    animation: 'float 3s ease-in-out infinite',
                                    '@keyframes float': {
                                        '0%, 100%': { transform: 'translateY(0)' },
                                        '50%': { transform: 'translateY(-6px)' }
                                    }
                                }}>
                                    <TrophyIcon sx={{ fontSize: 45, color: '#FFB300', filter: 'drop-shadow(0 4px 6px rgba(255,179,0,0.5))' }} />
                                </Box>
                            )}
                            
                            <Box sx={{ position: 'relative' }}>
                                <Avatar sx={{ 
                                    width: size, height: size, 
                                    background: bgGradient, color: isFirst ? '#000' : '#fff', 
                                    fontWeight: '900', fontSize: isFirst ? '2.5rem' : '1.8rem',
                                    border: `4px solid white`,
                                    boxShadow: `0 12px 24px ${shadowCol}60`
                                }}>
                                    {item.student.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                {/* Rank Badge */}
                                <Box sx={{
                                    position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: bgGradient, border: '3px solid white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '900', fontSize: '1rem', color: isFirst ? '#000' : '#fff',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }}>
                                    {item.rank}
                                </Box>
                            </Box>
                            
                            <Typography variant="subtitle1" fontWeight="900" sx={{ mt: 2.5, textAlign: 'center', width: {xs: 90, sm: 110}, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {item.student.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.8 }}>
                               <TrophyIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                               <Typography variant="caption" fontWeight="bold">
                                   ${item.student.dollarPoints}
                               </Typography>
                            </Box>
                        </Box>
                    </Fade>
                )
            })}
        </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 4 }}>
      {/* Glass Header (Sticky) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backgroundImage: 'none',
          borderBottom: `1px solid rgba(0,0,0,0.08)`,
          backdropFilter: 'blur(22px)',
          zIndex: 1000
        }}
      >
        <Toolbar sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
           <IconButton onClick={handleBack} sx={{ mr: 1, color: '#000', bgcolor: 'rgba(0,0,0,0.04)' }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '900', color: '#000', letterSpacing: '-0.03em', fontSize: { xs: '1.2rem', sm: '1.25rem' } }}>
              Student Leaderboard
            </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 3, pb: 12 }}>
        
        {/* Scrollable Filters */}
        <Box className="hide-scrollbar" sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}>
            <InputLabel>Class</InputLabel>
            <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
              {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}>
            <InputLabel>Area / Place</InputLabel>
            <Select value={selectedPlace} label="Area / Place" onChange={(e) => setSelectedPlace(e.target.value)}>
              {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
        ) : students.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>No students found in this area/class.</Alert>
        ) : (
          <>
            {/* Duolingo Floating Podium for Top 3 */}
            <FloatingPodium topStudents={students.slice(0, 3)} />

            {/* Minimalist Corporate List for Rank 4+ */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {students.slice(3).map((student, index) => {
                const rank = index + 4;
                return (
                  <Grow in={true} timeout={400 + (index * 100)} key={student.id}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.7)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'scale(1.01)', boxShadow: '0 6px 16px rgba(0,0,0,0.05)', bgcolor: 'white' }
                      }}
                    >
                      <CardContent sx={{ 
                          p: '12px 20px !important', 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: {xs: 1.5, sm: 2} }}>
                          <Typography variant="subtitle1" fontWeight="900" sx={{ color: 'text.disabled', minWidth: 24 }}>
                             {rank}
                          </Typography>
                          <Avatar 
                            sx={{ 
                              width: 36, height: 36, 
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              fontSize: 16,
                              fontWeight: 'bold'
                            }}
                          >
                            {student.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                              {student.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                              {student.place} • {student.classType}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="h6" fontWeight="800" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75em', color: '#F59E0B', marginRight: '2px' }}>$</span>{student.dollarPoints}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                );
              })}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default LeaderboardPage;