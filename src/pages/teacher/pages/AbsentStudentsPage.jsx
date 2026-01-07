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
  TextField,
  Chip,
  Alert,
  Grid,
  Container,
  IconButton,
  Avatar,
  MenuItem,
  InputAdornment,
  Fade,
  Grow,
  Divider,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PersonOff as AbsentIcon,
  LocationOn as PlaceIcon,
  Class as ClassIcon,
  Event as DateIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';

const AbsentStudentsPage = () => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  // --- DATABASE LOGIC (Unchanged) ---
  useEffect(() => {
    // Real-time listener for students
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      let studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by class
      if (selectedClass !== 'All') {
        studentsData = studentsData.filter(s => s.classType === selectedClass);
      }

      // Filter by place
      if (selectedPlace !== 'All') {
        if (selectedPlace === 'Other') {
          studentsData = studentsData.filter(s => {
            const loc = s.location || s.place || '';
            return !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(loc);
          });
        } else {
          studentsData = studentsData.filter(s => {
            const loc = s.location || s.place || '';
            return loc === selectedPlace;
          });
        }
      }

      // Filter by absent dates
      studentsData = studentsData.filter(student => {
        const absentDates = student.absentDates || [];
        // Robust check for date string presence
        return absentDates.some(date => date && date.startsWith(selectedDate));
      });

      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching absent students:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedPlace, selectedDate]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        // Red/Rose Gradient for "Absent/Alert" context
        background: 'linear-gradient(135deg, #FFF5F5 0%, #FFEBEE 100%)',
      }}
    >
      
      {/* 1. Header & Filters (Sticky) */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg" disableGutters>
          {/* Top Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/teacher/dashboard')} sx={{ mr: 1, bgcolor: 'white', boxShadow: 1 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: '800', color: '#d32f2f' }}>
              Absent List
            </Typography>
            <Chip 
              icon={<AbsentIcon style={{ color: 'white' }} />} 
              label={`${students.length} Absent`} 
              sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 'bold' }} 
            />
          </Box>

          {/* Filters Row */}
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{ minWidth: 150, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><DateIcon fontSize="small" color="error" /></InputAdornment>
              }}
            />
            
            <TextField
              select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              size="small"
              sx={{ minWidth: 140, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><ClassIcon fontSize="small" color="action" /></InputAdornment>
              }}
            >
              {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>

            <TextField
              select
              value={selectedPlace}
              onChange={(e) => setSelectedPlace(e.target.value)}
              size="small"
              sx={{ minWidth: 140, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" color="action" /></InputAdornment>
              }}
            >
              {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Box>
        </Container>
      </Paper>

      {/* 2. Content Grid */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress color="error" />
          </Box>
        ) : students.length === 0 ? (
          <Fade in={true}>
            <Box display="flex" flexDirection="column" alignItems="center" mt={6} sx={{ opacity: 0.7 }}>
              <AbsentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No students absent.</Typography>
              <Typography variant="body2" color="text.secondary">Check the date or change filters.</Typography>
            </Box>
          </Fade>
        ) : (
          <Grid container spacing={2}>
            {students.map((student, index) => (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Grow in={true} timeout={index * 100 + 300}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'error.light', // Red border for alert context
                      bgcolor: 'white',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        
                        {/* Student Info */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'error.50', 
                              color: 'error.main', 
                              width: 50, 
                              height: 50,
                              fontWeight: 'bold',
                              border: '1px solid',
                              borderColor: 'error.main'
                            }}
                          >
                            {student.name ? student.name.charAt(0) : '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {student.studentId}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip 
                                    label={student.classType} 
                                    size="small" 
                                    sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'grey.100' }} 
                                />
                                <Chip 
                                    icon={<PlaceIcon style={{ fontSize: 12 }} />}
                                    label={student.location || student.place || 'Unknown'} 
                                    size="small" 
                                    sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'grey.100' }} 
                                />
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="error.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                            <AbsentIcon fontSize="small" sx={{ mr: 0.5 }} /> ABSENT
                        </Typography>
                        
                        {/* Action Button */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="small" 
                            startIcon={<PhoneIcon />}
                            onClick={() => alert(`Calling parent of ${student.name}...`)}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Call Parent
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default AbsentStudentsPage;