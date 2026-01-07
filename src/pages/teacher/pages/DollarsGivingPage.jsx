import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  IconButton,
  Container,
  InputAdornment,
  Fab,
  Zoom,
  Chip,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Place as PlaceIcon,
  Class as ClassIcon,
  Send as SendIcon,
  MonetizationOn as CoinIcon
} from '@mui/icons-material';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  increment 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// --- Sub-Component: Slide-Up Reward Card ---
const RewardCard = ({ student, currentUser, dateToday, index }) => {
  const theme = useTheme();
  const [showInput, setShowInput] = useState(false);
  const [dollarsText, setDollarsText] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const quickAmounts = [1, 5, 10, 20];

  const handleSave = async () => {
    const amount = parseInt(dollarsText);
    if (!amount || amount <= 0 || !reason.trim()) return;

    setSaving(true);
    try {
      const rewardEntry = {
        date: dateToday,
        dollars: amount,
        reason: reason.trim(),
        teacher: currentUser?.name || 'Unknown'
      };

      await updateDoc(doc(db, 'students', student.id), {
        rewards: arrayUnion(rewardEntry),
        dollarPoints: increment(amount) 
      });

      setDollarsText('');
      setReason('');
      setShowInput(false); // Slide down after success
    } catch (error) {
      console.error('Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
      <Card 
        sx={{ 
          height: 280, 
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* --- View 1: Student Stats (Background Layer) --- */}
        <Box 
          sx={{ 
            height: '100%', 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            bgcolor: 'white'
          }}
        >
          <Box position="absolute" top={16} right={16}>
             <Chip 
               label={student.classType} 
               size="small" 
               sx={{ bgcolor: 'grey.100', fontWeight: 'bold', fontSize: '0.65rem' }} 
             />
          </Box>

          <Avatar 
            sx={{ 
              width: 70, 
              height: 70, 
              mb: 2,
              bgcolor: 'transparent',
              border: `2px solid ${theme.palette.secondary.main}`,
              color: theme.palette.secondary.main,
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}
          >
            {student.name ? student.name.charAt(0) : '?'}
          </Avatar>
          
          <Typography variant="h6" fontWeight="800" noWrap sx={{ maxWidth: '100%', px: 1 }}>
            {student.name}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5} color="text.secondary">
             <PlaceIcon sx={{ fontSize: 14 }} />
             <Typography variant="caption">{student.location || 'Unknown'}</Typography>
          </Box>

          <Box my={2}>
             <Typography variant="h3" fontWeight="900" sx={{ 
                 background: 'linear-gradient(45deg, #9C27B0, #E040FB)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent'
             }}>
                ${student.dollarPoints || 0}
             </Typography>
          </Box>

          <Fab 
            color="secondary" 
            variant="extended" 
            size="medium"
            onClick={() => setShowInput(true)}
            sx={{ 
                boxShadow: '0 4px 14px rgba(156, 39, 176, 0.4)',
                fontWeight: 'bold',
                px: 3,
                textTransform: 'none'
            }}
          >
            <AddIcon sx={{ mr: 1 }} /> Reward
          </Fab>
        </Box>

        {/* --- View 2: Action Overlay (Slide Up Layer) --- */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: '#FAFAFA',
            zIndex: 2,
            p: 2,
            transform: showInput ? 'translateY(0)' : 'translateY(100%)', // Slide Logic
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy effect
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Add Points
                </Typography>
                <IconButton size="small" onClick={() => setShowInput(false)} sx={{ bgcolor: 'grey.200' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Quick Amounts */}
            <Box display="flex" justifyContent="space-between" gap={1} my={1}>
                {quickAmounts.map(amt => (
                    <Button
                        key={amt}
                        variant={dollarsText === amt.toString() ? 'contained' : 'outlined'}
                        color="secondary"
                        onClick={() => setDollarsText(amt.toString())}
                        sx={{ 
                            minWidth: 0, 
                            flex: 1, 
                            borderRadius: 2, 
                            p: 0.5, 
                            fontWeight: 'bold',
                            boxShadow: 'none'
                        }}
                    >
                        +{amt}
                    </Button>
                ))}
            </Box>

            <TextField
                placeholder="Custom Amount"
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={dollarsText}
                onChange={(e) => setDollarsText(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><CoinIcon fontSize="small" color="secondary" /></InputAdornment>
                }}
                sx={{ mb: 1, bgcolor: 'white' }}
            />

            <TextField
                placeholder="Reason (e.g. Homework)"
                variant="outlined"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                sx={{ mb: 2, bgcolor: 'white' }}
            />

            <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleSave}
                disabled={saving || !dollarsText || !reason}
                endIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{ 
                    borderRadius: 3, 
                    py: 1, 
                    background: 'linear-gradient(45deg, #7B1FA2, #E040FB)',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(123, 31, 162, 0.3)'
                }}
            >
                {saving ? 'Sending' : 'Send Reward'}
            </Button>
        </Box>
      </Card>
    </Zoom>
  );
};

// --- Main Page Component ---
const DollarsGivingPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];
  const dateToday = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const studentsQuery = query(collection(db, 'students'), orderBy('name'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          location: data.place || data.location || 'Unknown' 
        };
      });
      setStudents(studentsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(student => {
    const classFilter = selectedClass === 'All' || student.classType === selectedClass;
    let placeFilter = true;
    if (selectedPlace !== 'All') {
      if (selectedPlace === 'Other') {
        placeFilter = !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(student.location);
      } else {
        placeFilter = student.location === selectedPlace;
      }
    }
    return classFilter && placeFilter;
  });

  return (
    <Box 
        sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #F3F4F6 0%, #E8EAF6 100%)',
        }}
    >
      
      {/* Sticky Glass Header */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, 
            position: 'sticky', 
            top: 0, 
            zIndex: 100,
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Container maxWidth="xl" disableGutters>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('/teacher/dashboard')} sx={{ mr: 1, bgcolor: 'white', boxShadow: 1 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: '900', letterSpacing: '-0.5px', background: 'linear-gradient(45deg, #7B1FA2, #E040FB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Student Rewards
                </Typography>
            </Box>

            {/* Compact Filters using TextField select for better icon support */}
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
                <TextField
                    select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 150, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <ClassIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                >
                    {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>

                <TextField
                    select
                    value={selectedPlace}
                    onChange={(e) => setSelectedPlace(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 150, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PlaceIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                >
                    {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
            </Box>
        </Container>
      </Paper>

      {/* Main Grid */}
      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress color="secondary" />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Alert 
              severity="info" 
              variant="outlined" 
              sx={{ mt: 4, bgcolor: 'white', borderRadius: 3, borderColor: 'secondary.main' }}
          >
              No students found. Try adjusting the filters.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredStudents.map((student, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                <RewardCard 
                  student={student} 
                  currentUser={currentUser}
                  dateToday={dateToday}
                  index={index}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default DollarsGivingPage;