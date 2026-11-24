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
} from '../../../services/studentData';
import { format } from 'date-fns';
import { startOfMonth, startOfWeek } from 'date-fns';
import Chip from '@mui/material/Chip';
import { mutateStudent } from '../../../services/studentData';
import { rewardBalance, rewardPeriodTotal } from '../../../utils/rewards';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { handleBackNavigation } from '../../../utils/navigation';
import { notifySuccess, notifyError, requestNotificationPermission } from '../../../services/notificationService';

const DollarsGivingPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saveError, setSaveError] = useState('');

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
  const canGiveDollars = isSunday || isAdmin;
  const todayFormatted = format(new Date(), 'EEEE, MMM dd, yyyy');

  // Fetch Students
  useEffect(() => {
    setLoadError('');
    setLoading(true);
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
      setLoading(false);
    }, () => { setLoadError('Could not load students. Check your connection and retry.'); setLoading(false); });

    return () => unsubscribe();
  }, [retry]);

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
      (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return classFilter && placeFilter && searchFilter;
  });

  const calculateDollarPoints = rewardBalance;

  // Handle Save Reward
  const handleSave = async () => {
    if (!canGiveDollars) {
      alert('Rewards can only be given on Sundays for teachers. Today is ' + todayFormatted + '.');
      return;
    }

    if (!selectedStudent || !rewardAmount || !rewardReason.trim()) {
      alert('Please select a student, enter amount, and provide a reason.');
      return;
    }

    if (saving) return;
    const amount = Number(rewardAmount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setSaveError('Enter a positive whole number of reward dollars.');
      return;
    }

    try {
      setSaving(true);
      setSaveError('');
      await mutateStudent(doc(db, 'students', selectedStudent.id), student => ({
        rewards: [...(student.rewards || []), { date: format(new Date(), 'yyyy-MM-dd'), dollars: amount, reason: rewardReason.trim(), teacher: currentUser?.name || 'Admin' }],
        dollarPoints: rewardBalance(student) + amount,
      }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setSelectedStudent(null);
      setRewardAmount('');
      setRewardReason('');
      setShowInput(false);
    } catch (error) {
      console.error('Error saving reward:', error);
      notifyError('Dollars failed', error.message || 'Failed to save dollars.');
      setSaveError('Failed to save reward: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDialog = (student) => {
    if (!canGiveDollars) {
      alert('Rewards can only be given on Sundays for teachers. Today is ' + todayFormatted + '.');
      return;
    }
    setSaveError('');
    setSelectedStudent(student);
    setShowInput(true);
  };

  return (
    <Box className="admin-page" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      
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

          <Typography color="text.secondary" sx={{ mb: 2 }}>Give and manage dollar rewards for students</Typography>
          <Paper className="reward-summary">
            <div><Typography color="text.secondary">Total Dollars Given</Typography><Typography variant="h4" fontWeight={800}>${students.reduce((sum, student) => sum + rewardBalance(student), 0).toLocaleString()}</Typography></div>
            <div><Typography color="text.secondary">This Month</Typography><Typography variant="h4" color="success.main" fontWeight={800}>${rewardPeriodTotal(students, startOfMonth(new Date())).toLocaleString()}</Typography></div>
            <div><Typography color="text.secondary">This Week</Typography><Typography variant="h4" color="success.main" fontWeight={800}>${rewardPeriodTotal(students, startOfWeek(new Date())).toLocaleString()}</Typography></div>
          </Paper>
          {loadError && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{loadError}</Alert>}
          {/* Scrollable Filters */}
          <Box className="reward-filters" sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
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
          
          {/* Warning Alert for Non-Sunday (only shown for teachers) */}
          {!isSunday && !isAdmin && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Rewards can only be given on Sundays by teachers. Today is {todayFormatted}.
            </Alert>
          )}

          {/* Info Banner for Admin (every day enabled) */}
          {isAdmin && !isSunday && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              🌟 Admin Privilege: You can award dollars on any day of the week. (Today is {todayFormatted}).
            </Alert>
          )}

      {/* Success Alert */}
      {showSuccess && <Alert severity="success" sx={{ mt: 2, mb: 2 }}>Reward saved successfully!</Alert>}

      {/* Student List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : filteredStudents.length === 0 ? (
          <Alert severity="info">No students match your filters.</Alert>
        ) : (
          <Paper className="reward-student-list" elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1,
                        py: 2
                      }}
                    >
                      <Box display="flex" alignItems="center" flexGrow={1} sx={{ minWidth: 0 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: 36, height: 36, mr: 1.25, fontSize: '1.1rem', fontWeight: 'bold'
                          }}
                        >
                          {(student.name || 'S').charAt(0)}
                        </Avatar>
                        
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '.9375rem', sm: '1rem' } }}>
                              {student.name}
                            </Typography>
                          }
                          secondary={`${student.studentId || 'No ID'} • ${student.classType || ''}`}
                          secondaryTypographyProps={{ sx: { fontSize: '.8125rem' } }}
                        />
                      </Box>
                      <Chip size="small" label={`$${dollarPoints}`} color="success" sx={{ flexShrink: 0, bgcolor: '#dff3e6', color: '#176239' }} />
                      <Button
                        variant="outlined"
                        startIcon={<DollarIcon />}
                        onClick={() => handleOpenDialog(student)}
                        disabled={!canGiveDollars}
                        size={isMobile ? "medium" : "small"}
                        fullWidth={false}
                        sx={{
                          bgcolor: 'transparent',
                          color: 'primary.main',
                          minWidth: 62,
                          px: 1,
                          flexShrink: 0,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          py: isMobile ? 1 : undefined,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          '&:disabled': {
                            bgcolor: 'action.disabledBackground',
                            color: 'action.disabled'
                          }
                        }}
                      >
                        {canGiveDollars ? 'Give' : 'Sunday only'}
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
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Amount ($)"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              fullWidth
              disabled={!canGiveDollars || saving}
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
              disabled={!canGiveDollars || saving}
              placeholder="Enter the reason for this reward..."
            />
            {!canGiveDollars && (
              <Alert severity="warning">
                Rewards can only be given on Sundays for teachers. Today is {todayFormatted}.
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
            disabled={!canGiveDollars || saving || !rewardAmount || !rewardReason.trim()}
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
