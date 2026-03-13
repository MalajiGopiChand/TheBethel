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
  Zoom,
  LinearProgress,
  alpha
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Save as SaveIcon,
  Refresh as RetakeIcon,
  LogoutRounded as LogoutIcon,
  HowToReg as PresentButtonIcon,
  DoNotDisturb as AbsentButtonIcon,
  RemoveCircleOutline as UnmarkIcon,
  FilterAlt as FilterIcon,
  Today as TodayIcon,
  Class as ClassIcon,
  LocationOn as LocationIcon,
  EmojiEvents as StreakIcon,
  RestartAlt as ResetIcon,
  CheckCircleOutline as CheckedIcon,
  RadioButtonUnchecked as UncheckedIcon
} from '@mui/icons-material';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where
} from 'firebase/firestore';
import { format, isSameDay, parseISO } from 'date-fns';
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
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date & State
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState({}); // Stores attendance for current session
  const [savedAttendance, setSavedAttendance] = useState({}); // Stores already saved attendance for the day
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'present', 'absent', 'unmarked'
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

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

  // Load saved attendance for selected date
  useEffect(() => {
    const loadSavedAttendance = async () => {
      if (!students.length || !attendanceDate) return;
      
      setLoadingAttendance(true);
      try {
        const dateStr = attendanceDate;
        const savedState = {};
        
        students.forEach(student => {
          const attendanceList = student.attendance || [];
          const absentDates = student.absentDates || [];
          
          if (attendanceList.includes(dateStr)) {
            savedState[student.id] = true; // Present
          } else if (absentDates.includes(dateStr)) {
            savedState[student.id] = false; // Absent
          }
          // If not in either, leave undefined (unmarked)
        });
        
        setSavedAttendance(savedState);
        // Only set attendance if it's the first load or date changed
        setAttendance(savedState);
        setHasLoadedSaved(true);
      } catch (error) {
        console.error('Error loading saved attendance:', error);
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadSavedAttendance();
  }, [students, attendanceDate]);

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

  // Check if student already has attendance for today
  const hasAttendanceForDay = (studentId) => {
    return savedAttendance[studentId] !== undefined;
  };

  // Mark as Present - only if not already marked
  const markPresent = (studentId) => {
    if (hasAttendanceForDay(studentId)) {
      alert('This student already has attendance marked for today. You cannot change it.');
      return;
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: true
    }));
  };

  // Mark as Absent - only if not already marked
  const markAbsent = (studentId) => {
    if (hasAttendanceForDay(studentId)) {
      alert('This student already has attendance marked for today. You cannot change it.');
      return;
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: false
    }));
  };

  // Unmark (clear attendance) - only if not already saved
  const unmarkStudent = (studentId) => {
    if (hasAttendanceForDay(studentId)) {
      alert('This student already has saved attendance. You cannot unmark it.');
      return;
    }
    setAttendance(prev => {
      const newAttendance = { ...prev };
      delete newAttendance[studentId];
      return newAttendance;
    });
  };

  // Bulk Actions - only for unmarked students
  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      if (!hasAttendanceForDay(student.id)) {
        newAttendance[student.id] = true;
      }
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      if (!hasAttendanceForDay(student.id)) {
        newAttendance[student.id] = false;
      }
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  // Save Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const dateStr = attendanceDate;

      // Only save for students who have been marked in this session
      const studentsToSave = filteredStudents.filter(s => 
        attendance[s.id] !== undefined && !hasAttendanceForDay(s.id)
      );
      
      if (studentsToSave.length === 0) {
        alert('No new attendance to save for the selected date.');
        setSaving(false);
        return;
      }

      for (const student of studentsToSave) {
        const isPresent = attendance[student.id];
        
        const attendanceList = student.attendance || [];
        const absentDates = student.absentDates || [];
        
        let newAttendanceList = [...attendanceList];
        let newAbsentDates = [...absentDates];
        let newStreak = student.currentStreak || 0;

        // Remove current date from both arrays if exists (cleanup)
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
          currentStreak: newStreak,
          lastAttendanceDate: dateStr
        });
      }

      // Update saved attendance state
      const newSavedAttendance = { ...savedAttendance };
      studentsToSave.forEach(s => {
        newSavedAttendance[s.id] = attendance[s.id];
      });
      setSavedAttendance(newSavedAttendance);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Clear attendance for saved students from current session
      setAttendance(prev => {
        const newAttendance = { ...prev };
        studentsToSave.forEach(s => {
          delete newAttendance[s.id];
        });
        return newAttendance;
      });

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
    let expectedDate = new Date(today);
    
    for (let i = 0; i < sorted.length; i++) {
      const dateStr = sorted[i];
      const date = new Date(dateStr);
      
      // Check if dates are consecutive (within 7-8 days for weekly attendance)
      const diffDays = Math.abs((expectedDate - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 8) { // Allow for weekly attendance
        streak++;
        expectedDate = new Date(date);
        expectedDate.setDate(expectedDate.getDate() - 7); // Move back 7 days for next check
      } else {
        break;
      }
    }
    return streak;
  };

  // Reset current session (clear unsaved marks)
  const resetSession = () => {
    setAttendance(savedAttendance);
  };

  // Stats
  const totalFiltered = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => attendance[s.id] === true).length;
  const absentCount = filteredStudents.filter(s => attendance[s.id] === false).length;
  const unmarkedCount = filteredStudents.filter(s => attendance[s.id] === undefined).length;
  const savedCount = filteredStudents.filter(s => savedAttendance[s.id] !== undefined).length;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      
      {/* Header */}
      <Paper 
        elevation={4} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          borderRadius: '0 0 30px 30px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.3)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1, color: '#667eea' }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#667eea' }}>
              📋 Attendance Tracker
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
                sx={{ color: '#764ba2' }}
              >
                {loadingLogout ? <CircularProgress size={24} /> : <LogoutIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Date Selector with Saved Indicator */}
          <Card sx={{ mb: 2, background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TodayIcon sx={{ color: '#667eea' }} />
                <TextField
                  type="date"
                  size="small"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Chip 
                  label={`${savedCount} Saved`}
                  color="success"
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="caption">TOTAL STUDENTS</Typography>
                <Typography variant="h4" fontWeight="bold">{totalFiltered}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="caption">PRESENT</Typography>
                <Typography variant="h4" fontWeight="bold">{presentCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="caption">ABSENT</Typography>
                <Typography variant="h4" fontWeight="bold">{absentCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="caption">UNMARKED</Typography>
                <Typography variant="h4" fontWeight="bold">{unmarkedCount}</Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="textSecondary">Progress</Typography>
              <Typography variant="body2" color="textSecondary">
                {Math.round(((presentCount + absentCount) / totalFiltered) * 100)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={((presentCount + absentCount) / totalFiltered) * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white', borderRadius: 2 }}>
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white', borderRadius: 2 }}>
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
              sx={{ flexGrow: 1, bgcolor: 'white', borderRadius: 2 }}
              InputProps={{
                startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
              }}
            />
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PresentButtonIcon />}
              onClick={markAllPresent}
              sx={{ 
                background: 'linear-gradient(145deg, #4caf50, #45a049)',
                '&:hover': { background: 'linear-gradient(145deg, #45a049, #4caf50)' }
              }}
            >
              All Present
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AbsentButtonIcon />}
              onClick={markAllAbsent}
              sx={{ 
                background: 'linear-gradient(145deg, #f44336, #d32f2f)',
                '&:hover': { background: 'linear-gradient(145deg, #d32f2f, #f44336)' }
              }}
            >
              All Absent
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={resetSession}
              sx={{ borderColor: '#ff9800', color: '#ff9800' }}
            >
              Reset
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || unmarkedCount === totalFiltered}
              sx={{ 
                ml: 'auto',
                background: 'linear-gradient(145deg, #667eea, #764ba2)',
                '&:hover': { background: 'linear-gradient(145deg, #764ba2, #667eea)' }
              }}
            >
              {saving ? 'Saving...' : `Save (${presentCount + absentCount - savedCount} new)`}
            </Button>
          </Stack>

          {/* Status Filter Chips */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={`All (${totalFiltered})`}
              onClick={() => setFilterStatus('all')}
              color={filterStatus === 'all' ? 'primary' : 'default'}
              size="small"
            />
            <Chip 
              label={`Present (${presentCount})`}
              onClick={() => setFilterStatus('present')}
              color={filterStatus === 'present' ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label={`Absent (${absentCount})`}
              onClick={() => setFilterStatus('absent')}
              color={filterStatus === 'absent' ? 'error' : 'default'}
              size="small"
            />
            <Chip 
              label={`Unmarked (${unmarkedCount})`}
              onClick={() => setFilterStatus('unmarked')}
              color={filterStatus === 'unmarked' ? 'warning' : 'default'}
              size="small"
            />
          </Stack>
        </Container>
      </Paper>

      {/* Loading Indicator */}
      {loadingAttendance && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <LinearProgress />
        </Box>
      )}

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
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.9)' }}>
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
              const isSaved = savedAttendance[student.id] !== undefined;
              const isPresent = status === true;
              const isAbsent = status === false;
              const isUnmarked = status === undefined;

              return (
                <Zoom in key={student.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid',
                      borderColor: isSaved 
                        ? '#4caf50'
                        : isPresent 
                        ? '#4caf50' 
                        : isAbsent 
                        ? '#f44336' 
                        : '#ff9800',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 8
                      }
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        {/* Student Info */}
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Badge
                            overlap="circular"
                            badgeContent={
                              isSaved ? (
                                <CheckedIcon sx={{ fontSize: 16, color: '#4caf50', bgcolor: 'white', borderRadius: '50%' }} />
                              ) : null
                            }
                          >
                            <Avatar
                              sx={{
                                background: isSaved 
                                  ? 'linear-gradient(145deg, #4caf50, #45a049)'
                                  : isPresent 
                                  ? 'linear-gradient(145deg, #4caf50, #45a049)'
                                  : isAbsent 
                                  ? 'linear-gradient(145deg, #f44336, #d32f2f)'
                                  : 'linear-gradient(145deg, #ff9800, #f57c00)',
                                width: 56,
                                height: 56,
                                boxShadow: 3
                              }}
                            >
                              {student.name.charAt(0)}
                            </Avatar>
                          </Badge>
                          
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {student.name}
                              {isSaved && (
                                <Chip
                                  size="small"
                                  label="Saved"
                                  color="success"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
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
                          <Tooltip title={isSaved ? "Already saved for today" : "Mark Present"}>
                            <span>
                              <Button
                                variant={isPresent ? 'contained' : 'outlined'}
                                color="success"
                                size="small"
                                onClick={() => markPresent(student.id)}
                                startIcon={<PresentIcon />}
                                disabled={isSaved}
                                sx={{ 
                                  minWidth: 100,
                                  opacity: isSaved ? 0.5 : 1
                                }}
                              >
                                Present
                              </Button>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title={isSaved ? "Already saved for today" : "Mark Absent"}>
                            <span>
                              <Button
                                variant={isAbsent ? 'contained' : 'outlined'}
                                color="error"
                                size="small"
                                onClick={() => markAbsent(student.id)}
                                startIcon={<AbsentIcon />}
                                disabled={isSaved}
                                sx={{ 
                                  minWidth: 100,
                                  opacity: isSaved ? 0.5 : 1
                                }}
                              >
                                Absent
                              </Button>
                            </span>
                          </Tooltip>
                          
                          {!isSaved && !isUnmarked && (
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
                            icon={<StreakIcon />}
                            label={`${student.currentStreak} week streak`}
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

      {/* Floating Action Buttons */}
      {unmarkedCount > 0 && (
        <Zoom in>
          <Button
            variant="contained"
            size="large"
            onClick={() => setFilterStatus('unmarked')}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              borderRadius: 50,
              background: 'linear-gradient(145deg, #ff9800, #f57c00)',
              boxShadow: 4,
              px: 3,
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(145deg, #f57c00, #ff9800)'
              }
            }}
            startIcon={<RetakeIcon />}
          >
            {unmarkedCount} Unmarked
          </Button>
        </Zoom>
      )}
    </Box>
  );
};

export default AttendancePage;
