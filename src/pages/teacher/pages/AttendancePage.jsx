import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  IconButton,
  Container,
  useTheme,
  Avatar
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const AttendancePage = () => {
  const { currentUser } = useAuth(); // Kept for future use if needed
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date & State
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState({}); // Stores local toggle state
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

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

  // Toggle Handler
  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      // If undefined, it means they were Present (default), so toggle to False (Absent)
      // If currently True (Present), toggle to False
      // If currently False (Absent), toggle to True
      [studentId]: prev[studentId] === undefined ? false : !prev[studentId]
    }));
  };

  // Streak Logic
  const calculateStreak = (dates, today) => {
    if (dates.length === 0) return 0;
    const sorted = dates.sort().reverse();
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] <= today) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Save Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const dateStr = attendanceDate;

      for (const student of filteredStudents) {
        const isPresent = attendance[student.id] ?? true;
        
        const attendanceList = student.attendance || [];
        const absentDates = student.absentDates || [];
        
        let newAttendanceList = [...attendanceList];
        let newAbsentDates = [...absentDates];
        let newStreak = student.currentStreak || 0;

        newAttendanceList = newAttendanceList.filter(d => d !== dateStr);
        newAbsentDates = newAbsentDates.filter(d => d !== dateStr);

        if (isPresent) {
          if (!newAttendanceList.includes(dateStr)) {
            newAttendanceList.push(dateStr);
          }
          const sortedDates = newAttendanceList.sort();
          newStreak = calculateStreak(sortedDates, dateStr);
        } else {
          if (!newAbsentDates.includes(dateStr)) {
            newAbsentDates.push(dateStr);
          }
          newStreak = 0;
        }

        await updateDoc(doc(db, 'students', student.id), {
          attendance: newAttendanceList,
          absentDates: newAbsentDates,
          currentStreak: newStreak,
          dollarPoints: student.dollarPoints || 0
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = true;
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  // Stats
  const currentPresentCount = filteredStudents.length - Object.values(attendance).filter(v => v === false).length;
  const currentAbsentCount = Object.values(attendance).filter(v => v === false).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      
      {/* 1. Header & Filters (Sticky) */}
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
            <IconButton onClick={() => navigate('/teacher/dashboard')} sx={{ mr: 1 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Daily Attendance
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave} 
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>

          {/* Quick Stats Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
             <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Total:</Typography>
                <Typography variant="subtitle2" fontWeight="bold">{filteredStudents.length}</Typography>
             </Box>
             <Divider orientation="vertical" flexItem />
             <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                <PresentIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">{currentPresentCount}</Typography>
             </Box>
             <Divider orientation="vertical" flexItem />
             <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                <AbsentIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">{currentAbsentCount}</Typography>
             </Box>
          </Box>

          {/* Collapsible Filters */}
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
            <TextField
              type="date"
              size="small"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              sx={{ minWidth: 140, bgcolor: 'white' }}
            />
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

      {/* 2. Success Alert */}
      <Fade in={showSuccess}>
        <Alert severity="success" sx={{ mx: 2, mt: 2, mb: 0 }}>Attendance saved successfully!</Alert>
      </Fade>

      {/* 3. Student List */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : filteredStudents.length === 0 ? (
          <Alert severity="info">No students match your filters.</Alert>
        ) : (
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
              {filteredStudents.map((student, index) => {
                const isPresent = attendance[student.id] ?? true;
                
                return (
                  <React.Fragment key={student.id}>
                    <ListItem 
                      sx={{ 
                        bgcolor: isPresent ? 'white' : '#fff5f5',
                        transition: 'background-color 0.3s',
                        '&:hover': { bgcolor: isPresent ? 'grey.50' : '#ffebeb' }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: isPresent ? theme.palette.primary.main : theme.palette.error.main,
                          width: 40, height: 40, mr: 2, fontSize: '0.9rem'
                        }}
                      >
                        {student.name.charAt(0)}
                      </Avatar>
                      
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" fontWeight="bold" color={isPresent ? 'text.primary' : 'error'}>
                            {student.name}
                          </Typography>
                        }
                        secondary={`${student.studentId} • ${student.location || 'No Location'}`}
                      />
                      
                      <ListItemSecondaryAction>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" fontWeight="bold" color={isPresent ? 'success.main' : 'error.main'}>
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                          </Typography>
                          <Switch
                            edge="end"
                            checked={isPresent}
                            onChange={() => toggleAttendance(student.id)}
                            color="success"
                          />
                        </Box>
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
    </Box>
  );
};

export default AttendancePage;