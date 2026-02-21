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
  useTheme,
  alpha
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

// --- Sub-Component: Reward Card ---
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
      setShowInput(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
      <Card 
        sx={{ 
          height: 280, 
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }
        }}
      >
        {/* Main Card Content */}
        <Box 
          sx={{ 
            height: '100%', 
            p: 2.5,
            display: 'flex', 
            flexDirection: 'column', 
            bgcolor: 'white'
          }}
        >
          {/* Class Chip */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
             <Chip 
              label={student.classType || 'Unassigned'} 
               size="small" 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 20
              }} 
             />
          </Box>

          {/* Avatar and Name */}
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Avatar 
            sx={{ 
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                fontSize: '1rem',
                fontWeight: 600
            }}
          >
              {getInitials(student.name)}
          </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
                {student.name || 'Unknown Student'}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {student.location || 'Unknown'}
          </Typography>
              </Box>
            </Box>
          </Box>

          {/* Points Display */}
          <Box 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
              p: 1.5,
              mb: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Total Points
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
                ${student.dollarPoints || 0}
             </Typography>
          </Box>

          {/* Reward Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowInput(true)}
            fullWidth
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          >
            Add Reward
          </Button>
        </Box>

        {/* Reward Input Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'white',
            zIndex: 2,
            p: 2.5,
            transform: showInput ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Add Points for {student.name}
                </Typography>
            <IconButton size="small" onClick={() => setShowInput(false)}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Quick Amounts */}
          <Box display="flex" gap={1} mb={2}>
                {quickAmounts.map(amt => (
                    <Button
                        key={amt}
                        variant={dollarsText === amt.toString() ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                        onClick={() => setDollarsText(amt.toString())}
                        sx={{ 
                  flex: 1,
                            minWidth: 0, 
                  fontWeight: 600
                        }}
                    >
                        +{amt}
                    </Button>
                ))}
            </Box>

            <TextField
            placeholder="Custom amount"
                type="number"
                size="small"
                fullWidth
                value={dollarsText}
                onChange={(e) => setDollarsText(e.target.value)}
                InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CoinIcon fontSize="small" color="primary" />
                </InputAdornment>
              )
                }}
            sx={{ mb: 2 }}
            />

            <TextField
            placeholder="Reason (e.g., Homework, Participation)"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            sx={{ mb: 2 }}
            />

            <Button
                variant="contained"
            color="primary"
                fullWidth
                onClick={handleSave}
                disabled={saving || !dollarsText || !reason}
                endIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              mt: 'auto'
                }}
            >
            {saving ? 'Saving...' : 'Save Reward'}
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
          location: data.place || data.location || 'Unknown',
          classType: data.classType || 'Unassigned',
          name: data.name || 'Unknown Student',
          dollarPoints: data.dollarPoints || 0
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
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 0,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <IconButton onClick={() => navigate(-1)} edge="start">
                    <BackIcon />
                </IconButton>
              <Typography variant="h5" fontWeight={600}>
                    Student Rewards
                </Typography>
            </Box>

            {/* Filters */}
            <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                    select
                label="Class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    size="small"
                sx={{ minWidth: 150 }}
                >
                {classOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
                </TextField>

                <TextField
                    select
                label="Location"
                    value={selectedPlace}
                    onChange={(e) => setSelectedPlace(e.target.value)}
                    size="small"
                sx={{ minWidth: 150 }}
                >
                {placeOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
                </TextField>
            </Box>
            </Box>
        </Container>
      </Paper>

      {/* Content */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
              No students found. Try adjusting the filters.
          </Alert>
        ) : (
          <Grid container spacing={2}>
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