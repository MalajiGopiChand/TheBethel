import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Grow,
  Fade,
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



  // Duolingo-style Floating Avatar Podium Helper
  const FloatingPodium = ({ topTeachers }) => {
    if (!topTeachers || topTeachers.length === 0) return null;
    
    // Order needs to be 2, 1, 3 for rendering visually.
    const podiumOrder = [
        { rank: 2, teacher: topTeachers[1] },
        { rank: 1, teacher: topTeachers[0] },
        { rank: 3, teacher: topTeachers[2] }
    ];

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: {xs: 2, sm: 4}, mt: 6, mb: 4 }}>
            {podiumOrder.map((item) => {
                if (!item.teacher) return <Box key={`empty-${item.rank}`} sx={{ width: 80 }} />;
                
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
                                    {item.teacher.teacherName?.charAt(0)?.toUpperCase()}
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
                                {item.teacher.teacherName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.8 }}>
                               <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                               <Typography variant="caption" fontWeight="bold">
                                   {item.teacher.totalPoints} pts
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
    <Box sx={{ minHeight: '100vh', pb: 4, background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
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
              Top Teachers
            </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 3 }}>
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
            {/* Duolingo Floating Podium */}
            <FloatingPodium topTeachers={leaders.slice(0, 3)} />

            {/* Minimalist Corporate List for Rank 4+ */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {leaders.slice(3).map((teacher, index) => {
                const rank = index + 4;
                return (
                  <Grow in={true} timeout={400 + (index * 100)} key={rank}>
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
                            {teacher.teacherName?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
                            {teacher.teacherName}
                          </Typography>
                        </Box>
                        
                        <Typography variant="h6" fontWeight="800" sx={{ color: 'text.primary' }}>
                          {teacher.totalPoints}<span style={{ fontSize: '0.65em', color: '#9e9e9e', marginLeft: '4px' }}>pts</span>
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

export default TeacherLeaderboardPage;