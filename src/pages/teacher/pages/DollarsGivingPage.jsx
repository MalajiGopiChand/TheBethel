import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider,
  Avatar,
  Fade
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  AttachMoney as DollarIcon,
  LogoutRounded as LogoutIcon
} from '@mui/icons-material';
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';

const DollarsGivingPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Reward input state
  const [showInput, setShowInput] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardReason, setRewardReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  // Check if today is Sunday (0 = Sunday)
  const isSunday = new Date().getDay() === 0;
  const todayFormatted = format(new Date(), 'EEEE, MMM dd, yyyy');

  // Fetch Students
  useEffect(() => {
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const classFilter = selectedClass === 'All' || student.classType === selectedClass;
    const loc = student.location || student.place || '';
    const placeFilter = selectedPlace === 'All' 
      ? true 
      : selectedPlace === 'Other'
      ? !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(loc)
      : loc === selectedPlace;
    const searchFilter = searchQuery === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return classFilter && placeFilter && searchFilter;
  });

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

  // Handle Save Reward
  const handleSave = async () => {
    if (!isSunday) {
      alert('Rewards can only be given on Sundays. Today is ' + todayFormatted + '.');
      return;
    }

    if (!selectedStudent || !rewardAmount || !rewardReason.trim()) {
      alert('Please select a student, enter amount, and provide a reason.');
      return;
    }

    const amount = parseInt(rewardAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number for the reward amount.');
      return;
    }

    try {
      setSaving(true);
      const studentRef = doc(db, 'students', selectedStudent.id);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const rewards = [...(studentData.rewards || [])];
        
        // Add new reward
        const newReward = {
          date: format(new Date(), 'yyyy-MM-dd'),
          dollars: amount,
          reason: rewardReason.trim(),
          teacher: currentUser?.name || currentUser?.email || 'Unknown'
        };
        
        rewards.push(newReward);
        
        // Calculate new total
        const newTotal = rewards.reduce((sum, r) => sum + (Number(r.dollars) || 0), 0);
        
        // Update document
        await updateDoc(studentRef, {
          rewards: rewards,
          dollarPoints: newTotal
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Reset form
        setSelectedStudent(null);
        setRewardAmount('');
        setRewardReason('');
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error saving reward:', error);
      alert('Failed to save reward: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDialog = (student) => {
    if (!isSunday) {
      alert('Rewards can only be given on Sundays. Today is ' + todayFormatted + '.');
      return;
    }
    setSelectedStudent(student);
    setShowInput(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      
      {/* Header & Filters (Sticky) */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          borderRadius: 0,
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Give Dollars
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isMobile ? (
                <Tooltip title={`Logout (${currentUser?.name || 'Teacher'})`}>
                  <Button
                    onClick={async () => {
                      setLoadingLogout(true);
                      try {
                        await logout();
                        navigate('/');
                      } catch (error) {
                        console.error('Logout error:', error);
                      } finally {
                        setLoadingLogout(false);
                      }
                    }}
                    disabled={loadingLogout}
                    startIcon={loadingLogout ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
                    size="small"
                    sx={{ 
                      color: 'error.main',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      px: 1.5,
                      minWidth: 'auto'
                    }}
                  >
                    {loadingLogout ? '' : (currentUser?.name?.split(' ')[0] || 'Teacher')}
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="Logout">
                  <IconButton
                    onClick={async () => {
                      setLoadingLogout(true);
                      try {
                        await logout();
                        navigate('/');
                      } catch (error) {
                        console.error('Logout error:', error);
                      } finally {
                        setLoadingLogout(false);
                      }
                    }}
                    disabled={loadingLogout}
                    sx={{ color: 'error.main' }}
                  >
                    {loadingLogout ? <CircularProgress size={20} /> : <LogoutIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Warning Alert for Non-Sunday */}
          {!isSunday && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Rewards can only be given on Sundays. Today is {todayFormatted}.
            </Alert>
          )}

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white' }}>
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white' }}>
              <InputLabel>Location</InputLabel>
              <Select value={selectedPlace} label="Location" onChange={(e) => setSelectedPlace(e.target.value)}>
                {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 150, bgcolor: 'white' }}
            />
          </Box>
        </Container>
      </Paper>

      {/* Success Alert */}
      <Fade in={showSuccess}>
        <Alert severity="success" sx={{ mx: 2, mt: 2, mb: 0 }}>Reward saved successfully!</Alert>
      </Fade>

      {/* Student List */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : filteredStudents.length === 0 ? (
          <Alert severity="info">No students match your filters.</Alert>
        ) : (
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
              {filteredStudents.map((student, index) => {
                const dollarPoints = calculateDollarPoints(student);
                
                return (
                  <React.Fragment key={student.id}>
                    <ListItem 
                      sx={{ 
                        bgcolor: 'white',
                        transition: 'background-color 0.3s',
                        '&:hover': { bgcolor: 'grey.50' }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.primary.main,
                          width: 40, height: 40, mr: 2, fontSize: '0.9rem'
                        }}
                      >
                        {student.name.charAt(0)}
                      </Avatar>
                      
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" fontWeight="bold">
                            {student.name}
                          </Typography>
                        }
                        secondary={`${student.studentId} • ${student.location || 'No Location'} • Current: $${dollarPoints}`}
                      />
                      
                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          startIcon={<DollarIcon />}
                          onClick={() => handleOpenDialog(student)}
                          disabled={!isSunday}
                          size="small"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            textTransform: 'none',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                            '&:disabled': {
                              bgcolor: 'grey.300',
                              color: 'grey.500'
                            }
                          }}
                        >
                          {isSunday ? 'Give Reward' : 'Only on Sundays'}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredStudents.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        )}
      </Container>

      {/* Reward Input Dialog */}
      <Dialog 
        open={showInput} 
        onClose={() => {
          if (!saving) {
            setShowInput(false);
            setSelectedStudent(null);
            setRewardAmount('');
            setRewardReason('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Give Reward to {selectedStudent?.name || 'Student'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Amount ($)"
              type="number"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              fullWidth
              disabled={!isSunday || saving}
              InputProps={{
                startAdornment: <DollarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <TextField
              label="Reason"
              multiline
              rows={3}
              value={rewardReason}
              onChange={(e) => setRewardReason(e.target.value)}
              fullWidth
              disabled={!isSunday || saving}
              placeholder="Enter the reason for this reward..."
            />
            {!isSunday && (
              <Alert severity="warning">
                Rewards can only be given on Sundays. Today is {todayFormatted}.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowInput(false);
              setSelectedStudent(null);
              setRewardAmount('');
              setRewardReason('');
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!isSunday || saving || !rewardAmount || !rewardReason.trim()}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <DollarIcon />}
          >
            {saving ? 'Saving...' : 'Save Reward'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DollarsGivingPage;
