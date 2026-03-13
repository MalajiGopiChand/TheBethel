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
  IconButton,
  Container,
  useTheme,
  Avatar,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Divider,
  Grid,
  LinearProgress,
  Badge,
  Drawer,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  Zoom
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
  Search as SearchIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as TimeIcon,
  CheckCircleOutline as CheckedIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon
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
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
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
  const [attendance, setAttendance] = useState({});
  const [savedAttendance, setSavedAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  
  // Mobile UI States
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [mobileView, setMobileView] = useState('list'); // 'list', 'stats', 'filters'

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  // Update rows per page based on screen size
  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

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
            savedState[student.id] = true;
          } else if (absentDates.includes(dateStr)) {
            savedState[student.id] = false;
          }
        });
        
        setSavedAttendance(savedState);
        setAttendance(savedState);
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

  // Mark as Present
  const markPresent = (studentId) => {
    if (hasAttendanceForDay(studentId)) {
      alert('This student already has attendance marked for today.');
      return;
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: true
    }));
  };

  // Mark as Absent
  const markAbsent = (studentId) => {
    if (hasAttendanceForDay(studentId)) {
      alert('This student already has attendance marked for today.');
      return;
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: false
    }));
  };

  // Unmark
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

  // Bulk Actions
  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      if (!hasAttendanceForDay(student.id)) {
        newAttendance[student.id] = true;
      }
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
    if (isMobile) setFilterDrawerOpen(false);
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      if (!hasAttendanceForDay(student.id)) {
        newAttendance[student.id] = false;
      }
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
    if (isMobile) setFilterDrawerOpen(false);
  };

  // Save Handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const dateStr = attendanceDate;

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

        newAttendanceList = newAttendanceList.filter(d => d !== dateStr);
        newAbsentDates = newAbsentDates.filter(d => d !== dateStr);

        if (isPresent) {
          newAttendanceList.push(dateStr);
        } else {
          newAbsentDates.push(dateStr);
        }

        await updateDoc(doc(db, 'students', student.id), {
          attendance: newAttendanceList,
          absentDates: newAbsentDates,
          lastAttendanceDate: dateStr,
          lastMarkedBy: currentUser?.name || 'Unknown Teacher'
        });
      }

      const newSavedAttendance = { ...savedAttendance };
      studentsToSave.forEach(s => {
        newSavedAttendance[s.id] = attendance[s.id];
      });
      setSavedAttendance(newSavedAttendance);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
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

  // Stats
  const totalFiltered = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => attendance[s.id] === true).length;
  const absentCount = filteredStudents.filter(s => attendance[s.id] === false).length;
  const unmarkedCount = filteredStudents.filter(s => attendance[s.id] === undefined).length;
  const savedCount = filteredStudents.filter(s => savedAttendance[s.id] !== undefined).length;

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get current time for check-in
  const getCurrentTime = () => {
    return format(new Date(), 'hh:mm a');
  };

  // Mobile Filter Drawer
  const FilterDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      disableSwipeToOpen={false}
      swipeAreaWidth={56}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80vh'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="600">Filters & Actions</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
            }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Class</InputLabel>
            <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
              {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Location</InputLabel>
            <Select value={selectedPlace} label="Location" onChange={(e) => setSelectedPlace(e.target.value)}>
              {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="date"
            size="small"
            label="Date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" color="text.secondary">Status Filter</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
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

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" color="text.secondary">Bulk Actions</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="small"
              onClick={markAllPresent}
              startIcon={<PresentButtonIcon />}
            >
              All Present
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              size="small"
              onClick={markAllAbsent}
              startIcon={<AbsentButtonIcon />}
            >
              All Absent
            </Button>
          </Stack>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={saving || unmarkedCount === totalFiltered}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ 
              mt: 2,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' }
            }}
          >
            {saving ? 'Saving...' : `Save (${presentCount + absentCount - savedCount} new)`}
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );

  // Mobile Stats View
  const MobileStatsView = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: '#4f46e5', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">TOTAL</Typography>
              <Typography variant="h4" fontWeight="bold">{totalFiltered}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: '#10b981', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">PRESENT</Typography>
              <Typography variant="h4" fontWeight="bold">{presentCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: '#ef4444', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">ABSENT</Typography>
              <Typography variant="h4" fontWeight="bold">{absentCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: '#f59e0b', color: 'white' }}>
            <CardContent>
              <Typography variant="caption">UNMARKED</Typography>
              <Typography variant="h4" fontWeight="bold">{unmarkedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2, bgcolor: '#f8fafc' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography color="#64748b" variant="caption">AVERAGE CHECK-IN</Typography>
              <Typography variant="h5" fontWeight="600" color="#1e293b">08:25 AM</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography color="#64748b" variant="caption">COMPLETION</Typography>
              <Typography variant="h5" fontWeight="600" color="#4f46e5">
                {Math.round(((presentCount + absentCount) / totalFiltered) * 100)}%
              </Typography>
            </Box>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={((presentCount + absentCount) / totalFiltered) * 100} 
            sx={{ mt: 1, height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      <Button
        fullWidth
        variant="contained"
        startIcon={<FilterListIcon />}
        onClick={() => setFilterDrawerOpen(true)}
        sx={{ mt: 2, bgcolor: '#1e293b' }}
      >
        Open Filters & Actions
      </Button>
    </Box>
  );

  // Mobile Student Card View
  const MobileStudentCard = ({ student }) => {
    const status = attendance[student.id];
    const isSaved = savedAttendance[student.id] !== undefined;
    const isPresent = status === true;
    const isAbsent = status === false;

    return (
      <Card sx={{ mb: 2, borderRadius: 3, border: '1px solid', borderColor: isSaved ? '#10b981' : '#e2e8f0' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Badge
              overlap="circular"
              badgeContent={isSaved ? <CheckedIcon sx={{ fontSize: 16, color: '#10b981', bgcolor: 'white', borderRadius: '50%' }} /> : null}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: isPresent ? '#10b981' : isAbsent ? '#ef4444' : '#f59e0b'
                }}
              >
                {student.name.charAt(0)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight="600">{student.name}</Typography>
                <Chip
                  size="small"
                  label={student.studentId}
                  variant="outlined"
                  sx={{ height: 20 }}
                />
              </Stack>
              
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  icon={<LocationIcon sx={{ fontSize: 14 }} />}
                  label={student.location || 'No Location'}
                  variant="outlined"
                  sx={{ height: 24 }}
                />
                <Chip
                  size="small"
                  label={student.classType || 'No Class'}
                  sx={{ height: 24, bgcolor: '#eef2ff', color: '#4f46e5' }}
                />
              </Stack>

              {isSaved && (
                <Typography variant="caption" color="#10b981" sx={{ mt: 0.5, display: 'block' }}>
                  ✓ Marked by: {student.lastMarkedBy || 'Teacher'}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Box>
              {isPresent ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TimeIcon sx={{ color: '#64748b', fontSize: 16 }} />
                  <Typography variant="body2">{getCurrentTime()}</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="#64748b">No check-in</Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title={isSaved ? "Already saved" : "Present"}>
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => markPresent(student.id)}
                    disabled={isSaved}
                    sx={{ 
                      bgcolor: isPresent ? '#10b98120' : 'transparent',
                      border: '1px solid',
                      borderColor: isPresent ? '#10b981' : '#e2e8f0'
                    }}
                  >
                    <PresentIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Tooltip title={isSaved ? "Already saved" : "Absent"}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => markAbsent(student.id)}
                    disabled={isSaved}
                    sx={{ 
                      bgcolor: isAbsent ? '#ef444420' : 'transparent',
                      border: '1px solid',
                      borderColor: isAbsent ? '#ef4444' : '#e2e8f0'
                    }}
                  >
                    <AbsentIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              {!isSaved && !isPresent && !isAbsent && (
                <Tooltip title="Unmark">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => unmarkStudent(student.id)}
                    sx={{ border: '1px solid', borderColor: '#e2e8f0' }}
                  >
                    <UnmarkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      pb: isMobile ? 7 : 0 // Space for bottom navigation
    }}>
      
      {/* Header - Mobile Optimized */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: isMobile ? 1.5 : 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          borderRadius: 0,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: 'white'
        }}
      >
        <Container maxWidth="xl" disableGutters={isMobile}>
          <Stack direction="row" alignItems="center" spacing={isMobile ? 1 : 2}>
            <IconButton onClick={handleBack} sx={{ color: '#64748b' }}>
              <BackIcon />
            </IconButton>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant={isMobile ? "subtitle1" : "h5"} fontWeight="600" color="#1e293b" noWrap>
                {isMobile ? 'Attendance' : 'Attendance Dashboard'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
                <Chip
                  size="small"
                  icon={<PersonIcon />}
                  label={isMobile ? currentUser?.name?.split(' ')[0] : (currentUser?.name || 'Teacher')}
                  sx={{ bgcolor: '#eef2ff', color: '#4f46e5', height: isMobile ? 24 : 32 }}
                />
                {!isMobile && (
                  <Chip
                    size="small"
                    icon={<TodayIcon />}
                    label={format(new Date(attendanceDate), 'EEEE, MMMM d, yyyy')}
                    sx={{ bgcolor: '#f1f5f9', color: '#475569' }}
                  />
                )}
              </Stack>
            </Box>

            {!isMobile && (
              <Button
                variant="outlined"
                color="error"
                startIcon={loadingLogout ? <CircularProgress size={20} /> : <LogoutIcon />}
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
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            )}

            {isMobile && (
              <IconButton
                color="error"
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
              >
                {loadingLogout ? <CircularProgress size={24} /> : <LogoutIcon />}
              </IconButton>
            )}
          </Stack>

          {/* Mobile Date Display */}
          {isMobile && (
            <Typography variant="caption" color="#64748b" sx={{ display: 'block', mt: 1, ml: 5 }}>
              {format(new Date(attendanceDate), 'EEEE, MMMM d, yyyy')}
            </Typography>
          )}
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 3, px: isMobile ? 1 : 3 }}>
        
        {/* Desktop Stats Cards */}
        {!isMobile && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="#64748b" fontSize="0.875rem" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="#1e293b">
                    {totalFiltered}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    <TrendingUpIcon sx={{ color: '#10b981', fontSize: 16 }} />
                    <Typography variant="body2" color="#10b981" fontWeight="500">
                      {Math.round((presentCount / totalFiltered) * 100)}% present
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="#64748b" fontSize="0.875rem" gutterBottom>
                    Present Today
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="#10b981">
                    {presentCount}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    <Chip size="small" label={`${Math.round((presentCount / totalFiltered) * 100)}%`} sx={{ bgcolor: '#d1fae5', color: '#065f46', height: 24 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="#64748b" fontSize="0.875rem" gutterBottom>
                    Absent Today
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="#ef4444">
                    {absentCount}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                    <Typography variant="body2" color="#64748b">{Math.round((absentCount / totalFiltered) * 100)}%</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="#64748b" fontSize="0.875rem" gutterBottom>
                    Average Check-In
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="#f59e0b">
                    08:25 AM
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    <TimeIcon sx={{ color: '#64748b', fontSize: 16 }} />
                    <Typography variant="body2" color="#64748b">Consistent</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Mobile View Switcher */}
        {isMobile && (
          <>
            <BottomNavigation
              value={bottomNavValue}
              onChange={(event, newValue) => {
                setBottomNavValue(newValue);
                if (newValue === 0) setMobileView('list');
                else if (newValue === 1) setMobileView('stats');
              }}
              sx={{ 
                position: 'sticky', 
                top: 70, 
                zIndex: 90, 
                bgcolor: 'white',
                borderRadius: 2,
                mb: 2
              }}
            >
              <BottomNavigationAction label="Students" icon={<PeopleIcon />} />
              <BottomNavigationAction label="Stats" icon={<DashboardIcon />} />
            </BottomNavigation>

            {mobileView === 'stats' && <MobileStatsView />}
          </>
        )}

        {/* Desktop Filters */}
        {!isMobile && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 2 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
                }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Class</InputLabel>
                <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                  {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Location</InputLabel>
                <Select value={selectedPlace} label="Location" onChange={(e) => setSelectedPlace(e.target.value)}>
                  {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </Select>
              </FormControl>

              <TextField
                type="date"
                size="small"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                sx={{ minWidth: 180 }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={markAllPresent}
                  startIcon={<PresentButtonIcon />}
                >
                  All Present
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={markAllAbsent}
                  startIcon={<AbsentButtonIcon />}
                >
                  All Absent
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving || unmarkedCount === totalFiltered}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ bgcolor: '#4f46e5' }}
                >
                  {saving ? 'Saving...' : `Save (${presentCount + absentCount - savedCount})`}
                </Button>
              </Box>
            </Stack>

            {/* Status Filter Chips */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip label={`All (${totalFiltered})`} onClick={() => setFilterStatus('all')} color={filterStatus === 'all' ? 'primary' : 'default'} size="small" />
              <Chip label={`Present (${presentCount})`} onClick={() => setFilterStatus('present')} color={filterStatus === 'present' ? 'success' : 'default'} size="small" />
              <Chip label={`Absent (${absentCount})`} onClick={() => setFilterStatus('absent')} color={filterStatus === 'absent' ? 'error' : 'default'} size="small" />
              <Chip label={`Unmarked (${unmarkedCount})`} onClick={() => setFilterStatus('unmarked')} color={filterStatus === 'unmarked' ? 'warning' : 'default'} size="small" />
            </Stack>
          </Paper>
        )}

        {/* Success Alert */}
        <Fade in={showSuccess}>
          <Alert severity="success" sx={{ mb: 2 }}>Attendance saved successfully!</Alert>
        </Fade>

        {/* Loading Indicator */}
        {loadingAttendance && <LinearProgress sx={{ mb: 2 }} />}

        {/* Mobile Filter Button */}
        {isMobile && mobileView === 'list' && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDrawerOpen(true)}
            sx={{ mb: 2 }}
          >
            Filters & Actions
          </Button>
        )}

        {/* Desktop Table View */}
        {!isMobile && (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Check-In</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>No students found</TableCell></TableRow>
                ) : (
                  filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((student) => {
                    const status = attendance[student.id];
                    const isSaved = savedAttendance[student.id] !== undefined;
                    const isPresent = status === true;
                    const isAbsent = status === false;

                    return (
                      <TableRow key={student.id} hover>
                        <TableCell><Typography fontWeight="500">{student.studentId}</Typography></TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: isPresent ? '#10b981' : isAbsent ? '#ef4444' : '#f59e0b' }}>
                              {student.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="500">{student.name}</Typography>
                              {isSaved && <Typography variant="caption" color="#10b981">Marked by: {student.lastMarkedBy || 'Teacher'}</Typography>}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell><Chip size="small" icon={<LocationIcon />} label={student.location || 'No Location'} variant="outlined" /></TableCell>
                        <TableCell><Chip size="small" label={student.classType || 'No Class'} sx={{ bgcolor: '#eef2ff', color: '#4f46e5' }} /></TableCell>
                        <TableCell>{isPresent ? <Stack direction="row" alignItems="center" spacing={0.5}><TimeIcon sx={{ fontSize: 16 }} /><Typography>{getCurrentTime()}</Typography></Stack> : '-'}</TableCell>
                        <TableCell>
                          {isSaved ? <Chip size="small" label="Saved" color="success" icon={<CheckedIcon />} /> :
                           isPresent ? <Chip size="small" label="Present" color="success" icon={<PresentIcon />} /> :
                           isAbsent ? <Chip size="small" label="Absent" color="error" icon={<AbsentIcon />} /> :
                           <Chip size="small" label="Unmarked" color="warning" variant="outlined" />}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" color="success" onClick={() => markPresent(student.id)} disabled={isSaved}>
                              <PresentIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => markAbsent(student.id)} disabled={isSaved}>
                              <AbsentIcon fontSize="small" />
                            </IconButton>
                            {!isSaved && !isPresent && !isAbsent && (
                              <IconButton size="small" color="warning" onClick={() => unmarkStudent(student.id)}>
                                <UnmarkIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}

        {/* Mobile Card View */}
        {isMobile && mobileView === 'list' && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : filteredStudents.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>No students found</Paper>
            ) : (
              filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(student => (
                <MobileStudentCard key={student.id} student={student} />
              ))
            )}
            
            {/* Mobile Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                sx={{ mr: 1 }}
              >
                Previous
              </Button>
              <Typography sx={{ px: 2, py: 1 }}>
                Page {page + 1} of {Math.ceil(filteredStudents.length / rowsPerPage)}
              </Typography>
              <Button
                size="small"
                disabled={page >= Math.ceil(filteredStudents.length / rowsPerPage) - 1}
                onClick={() => setPage(page + 1)}
                sx={{ ml: 1 }}
              >
                Next
              </Button>
            </Box>
          </>
        )}

        {/* Unmarked Banner */}
        {unmarkedCount > 0 && (
          <Paper sx={{ mt: 2, p: 2, bgcolor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <RetakeIcon sx={{ color: '#f59e0b' }} />
                <Typography color="#92400e" fontWeight="500">
                  {unmarkedCount} student{unmarkedCount > 1 ? 's' : ''} unmarked
                </Typography>
              </Stack>
              <Button variant="outlined" color="warning" size="small" onClick={() => setFilterStatus('unmarked')} startIcon={<RetakeIcon />}>
                Retake
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>

      {/* Mobile Filter Drawer */}
      <FilterDrawer />

      {/* Mobile FAB for Filters */}
      {isMobile && mobileView === 'list' && (
        <Zoom in>
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 80, right: 16 }}
            onClick={() => setFilterDrawerOpen(true)}
          >
            <FilterListIcon />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default AttendancePage;
