import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
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
import { notifySuccess, notifyError, requestNotificationPermission } from '../../../services/notificationService';

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
    requestNotificationPermission();
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
        notifySuccess('Dollars saved', `Saved $${amount} for ${selectedStudent.name}.`);
        
        // Reset form
        setSelectedStudent(null);
        setRewardAmount('');
        setRewardReason('');
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error saving reward:', error);
      notifyError('Dollars failed', error.message || 'Failed to save dollars.');
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
      
      {/* 1. Glass Header (Sticky) */}
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
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '900', color: '#000', letterSpacing: '-0.03em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Give Dollars
            </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Page Content */}
      <Container maxWidth="lg" sx={{ pt: 3, pb: 12 }}>

          {/* Scrollable Filters */}
          <Box className="hide-scrollbar" sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
            <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}>
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}>
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
              sx={{ flexGrow: 1, minWidth: 180, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}
            />
          </Box>
          
          {/* Warning Alert for Non-Sunday */}
          {!isSunday && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Rewards can only be given on Sundays. Today is {todayFormatted}.
            </Alert>
          )}

      {/* Success Alert */}
      <Fade in={showSuccess}>
        <Alert severity="success" sx={{ mx: 2, mt: 2, mb: 0 }}>Reward saved successfully!</Alert>
      </Fade>

      {/* Student List */}
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
                        bgcolor: 'background.paper',
                        transition: 'background-color 0.3s',
                        '&:hover': { bgcolor: 'action.hover' },
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'stretch' : 'center',
                        gap: isMobile ? 2 : 0,
                        py: 2
                      }}
                    >
                      <Box display="flex" alignItems="center" flexGrow={1} width={isMobile ? '100%' : 'auto'}>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: 48, height: 48, mr: 2, fontSize: '1.2rem', fontWeight: 'bold'
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
                          secondary={`${student.studentId} • ${student.location || student.place || 'No Location'} • Current: $${dollarPoints}`}
                        />
                      </Box>
                      
                      <Button
                        variant="contained"
                        startIcon={<DollarIcon />}
                        onClick={() => handleOpenDialog(student)}
                        disabled={!isSunday}
                        size={isMobile ? "medium" : "small"}
                        fullWidth={isMobile}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          py: isMobile ? 1 : undefined,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '&:disabled': {
                            bgcolor: 'action.disabledBackground',
                            color: 'action.disabled'
                          }
                        }}
                      >
                        {isSunday ? 'Give Reward' : 'Only on Sundays'}
                      </Button>
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
