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
  Divider,
  IconButton,
  Container,
  useTheme,
  Avatar,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Badge,
  Zoom
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Save as SaveIcon,
  Refresh as RetakeIcon,
  Person as PersonIcon,
  LogoutRounded as LogoutIcon,
  HowToReg as PresentButtonIcon,
  DoNotDisturb as AbsentButtonIcon,
  RemoveCircleOutline as UnmarkIcon,
  FilterAlt as FilterIcon,
  Today as TodayIcon,
  Class as ClassIcon,
  LocationOn as LocationIcon
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
import { handleBackNavigation } from '../../../utils/navigation';

const AttendancePage = () => {
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
  
  // Date & State
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState({}); // true = present, false = absent, undefined = unmarked
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'present', 'absent', 'unmarked'

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
    
    // Status filter
    let statusFilter = true;
    if (filterStatus !== 'all') {
      const studentStatus = attendance[student.id];
      if (filterStatus === 'present') statusFilter = studentStatus === true;
      else if (filterStatus === 'absent') statusFilter = studentStatus === false;
      else if (filterStatus === 'unmarked') statusFilter = studentStatus === undefined;
    }
    
    return classFilter && placeFilter && searchFilter && statusFilter;
  });

  // Mark as Present
  const markPresent = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: true
    }));
  };

  // Mark as Absent
  const markAbsent = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: false
    }));
  };

  // Unmark (clear attendance)
  const unmarkStudent = (studentId) => {
    setAttendance(prev => {
      const newAttendance = { ...prev };
      delete newAttendance[studentId];
      return newAttendance;
    });
  };

  // Bulk Actions
  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = true;
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = false;
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const clearAllUnmarked = () => {
    const newAttendance = { ...attendance };
    filteredStudents.forEach(student => {
      if (newAttendance[student.id] === undefined) {
        delete newAttendance[student.id];
      }
    });
    setAttendance(newAttendance);
  };

  // Retake attendance for unmarked students only
  const retakeUnmarked = () => {
    // This just sets the filter to show unmarked students
    setFilterStatus('unmarked');
  };

  // Stats
  const totalFiltered = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => attendance[s.id] === true).length;
  const absentCount = filteredStudents.filter(s => attendance[s.id] === false).length;
  const unmarkedCount = filteredStudents.filter(s => attendance[s.id] === undefined).length;

  // Save Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const dateStr = attendanceDate;

      // Only save for students who have been marked (present or absent)
      const studentsToSave = filteredStudents.filter(s => attendance[s.id] !== undefined);
      
      for (const student of studentsToSave) {
        const isPresent = attendance[student.id];
        
        const attendanceList = student.attendance || [];
        const absentDates = student.absentDates || [];
        
        let newAttendanceList = [...attendanceList];
        let newAbsentDates = [...absentDates];
        let newStreak = student.currentStreak || 0;

        // Remove current date from both arrays
        newAttendanceList = newAttendanceList.filter(d => d !== dateStr);
        newAbsentDates = newAbsentDates.filter(d => d !== dateStr);

        if (isPresent) {
          newAttendanceList.push(dateStr);
          // Calculate streak for present
          const sortedDates = newAttendanceList.sort();
          newStreak = calculateStreak(sortedDates, dateStr);
        } else {
          newAbsentDates.push(dateStr);
          newStreak = 0;
        }

        await updateDoc(doc(db, 'students', student.id), {
          attendance: newAttendanceList,
          absentDates: newAbsentDates,
          currentStreak: newStreak
        });
      }

      // Clear attendance for saved students
      setAttendance(prev => {
        const newAttendance = { ...prev };
        studentsToSave.forEach(s => {
          delete newAttendance[s.id];
        });
        return newAttendance;
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate streak
  const calculateStreak = (dates, today) => {
    if (dates.length === 0) return 0;
    const sorted = dates.sort().reverse();
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < sorted.length; i++) {
      const dateStr = sorted[i];
      const date = new Date(dateStr);
      const diffTime = currentDate - date;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (i === 0 && diffDays <= 7) {
        streak++;
        currentDate = date;
      } else if (streak > 0 && diffDays <= 7) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: '#f0f2f5',
      background: 'linear-gradient(145deg, #f0f2f5 0%, #ffffff 100%)'
    }}>
      
      {/* Header */}
      <Paper 
        elevation={4} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          borderRadius: '0 0 20px 20px',
          background: 'linear-gradient(145deg, #2196f3 0%, #1976d2 100%)',
          color: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ color: 'white', mr: 1 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              📋 Daily Attendance
            </Typography>
            <Tooltip title={`${currentUser?.name || 'Teacher'}`}>
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
                sx={{ color: 'white' }}
              >
                {loadingLogout ? <CircularProgress size={24} color="inherit" /> : <LogoutIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Stats Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Card sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="rgba(255,255,255,0.8)">TOTAL</Typography>
                <Typography variant="h4" fontWeight="bold">{totalFiltered}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: '#4caf50', color: 'white' }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption">PRESENT</Typography>
                <Typography variant="h4" fontWeight="bold">{presentCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: '#f44336', color: 'white' }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption">ABSENT</Typography>
                <Typography variant="h4" fontWeight="bold">{absentCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, bgcolor: '#ff9800', color: 'white' }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption">UNMARKED</Typography>
                <Typography variant="h4" fontWeight="bold">{unmarkedCount}</Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              type="date"
              size="small"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              sx={{ 
                minWidth: 140, 
                bgcolor: 'white', 
                borderRadius: 1,
                '& .MuiInputBase-root': { bgcolor: 'white' }
              }}
              InputProps={{
                startAdornment: <TodayIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white', borderRadius: 1 }}>
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white', borderRadius: 1 }}>
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
              sx={{ flexGrow: 1, bgcolor: 'white', borderRadius: 1 }}
              InputProps={{
                startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
              }}
            />
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PresentButtonIcon />}
              onClick={markAllPresent}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
            >
              All Present
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<AbsentButtonIcon />}
              onClick={markAllAbsent}
            >
              All Absent
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<RetakeIcon />}
              onClick={retakeUnmarked}
              sx={{ borderColor: '#ff9800', color: '#ff9800' }}
            >
              Retake Unmarked
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || unmarkedCount === totalFiltered}
              sx={{ ml: 'auto' }}
            >
              {saving ? 'Saving...' : `Save (${presentCount + absentCount})`}
            </Button>
          </Stack>

          {/* Status Filter Chips */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip 
              label="All" 
              onClick={() => setFilterStatus('all')}
              color={filterStatus === 'all' ? 'primary' : 'default'}
              size="small"
            />
            <Chip 
              label="Present" 
              onClick={() => setFilterStatus('present')}
              color={filterStatus === 'present' ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label="Absent" 
              onClick={() => setFilterStatus('absent')}
              color={filterStatus === 'absent' ? 'error' : 'default'}
              size="small"
            />
            <Chip 
              label="Unmarked" 
              onClick={() => setFilterStatus('unmarked')}
              color={filterStatus === 'unmarked' ? 'warning' : 'default'}
              size="small"
            />
          </Stack>
        </Container>
      </Paper>

      {/* Success Alert */}
      <Fade in={showSuccess}>
        <Alert severity="success" sx={{ mx: 2, mt: 2, mb: 0 }}>
          Attendance saved successfully!
        </Alert>
      </Fade>

      {/* Student List */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No students found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredStudents.map((student) => {
              const status = attendance[student.id];
              const isPresent = status === true;
              const isAbsent = status === false;
              const isUnmarked = status === undefined;

              return (
                <Zoom in key={student.id} style={{ transitionDelay: '50ms' }}>
                  <Paper
                    elevation={2}
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: isPresent ? '#4caf50' : isAbsent ? '#f44336' : '#ff9800',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateX(8px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        {/* Student Info */}
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Badge
                            color={isPresent ? 'success' : isAbsent ? 'error' : 'warning'}
                            variant="dot"
                            overlap="circular"
                          >
                            <Avatar
                              sx={{
                                bgcolor: isPresent ? '#4caf50' : isAbsent ? '#f44336' : '#ff9800',
                                width: 48,
                                height: 48,
                                boxShadow: 2
                              }}
                            >
                              {student.name.charAt(0)}
                            </Avatar>
                          </Badge>
                          
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {student.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Chip
                                size="small"
                                label={student.studentId}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                icon={<LocationIcon />}
                                label={student.location || 'No Location'}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                icon={<ClassIcon />}
                                label={student.classType || 'No Class'}
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Mark Present">
                            <Button
                              variant={isPresent ? 'contained' : 'outlined'}
                              color="success"
                              size="small"
                              onClick={() => markPresent(student.id)}
                              startIcon={<PresentIcon />}
                              sx={{ minWidth: 100 }}
                            >
                              Present
                            </Button>
                          </Tooltip>
                          
                          <Tooltip title="Mark Absent">
                            <Button
                              variant={isAbsent ? 'contained' : 'outlined'}
                              color="error"
                              size="small"
                              onClick={() => markAbsent(student.id)}
                              startIcon={<AbsentIcon />}
                              sx={{ minWidth: 100 }}
                            >
                              Absent
                            </Button>
                          </Tooltip>
                          
                          {!isUnmarked && (
                            <Tooltip title="Unmark">
                              <IconButton
                                color="warning"
                                size="small"
                                onClick={() => unmarkStudent(student.id)}
                              >
                                <UnmarkIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>

                      {/* Streak Info */}
                      {student.currentStreak > 0 && (
                        <Box sx={{ mt: 1, ml: 8 }}>
                          <Chip
                            size="small"
                            label={`🔥 ${student.currentStreak} week streak`}
                            color="warning"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Zoom>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* Floating Action Button for Retake */}
      {unmarkedCount > 0 && (
        <Zoom in>
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={retakeUnmarked}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              borderRadius: 50,
              boxShadow: 4,
              px: 3,
              py: 1.5
            }}
            startIcon={<RetakeIcon />}
          >
            Retake Attendance ({unmarkedCount} unmarked)
          </Button>
        </Zoom>
      )}
    </Box>
  );
};

export default AttendancePage;
