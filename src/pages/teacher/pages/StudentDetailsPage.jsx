import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Card, CardContent, CircularProgress,
  TextField, Grid, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, InputAdornment, IconButton, useTheme, useMediaQuery, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Select, FormControl, InputLabel, Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  AttachMoney as DollarIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  FactCheck as AttendanceIcon
} from '@mui/icons-material';
import {
  doc, onSnapshot, collection, query, where, updateDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { 
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, addMonths, subMonths,
  isToday, isThisWeek, isThisMonth
} from 'date-fns';

const StudentDetailsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  
  const studentId = searchParams.get('id');
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [unifiedAttendance, setUnifiedAttendance] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.email === 'gop1@gmail.com' || currentUser?.email === 'premkumartenali@gmail.com';
  
  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Attendance Details Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const studentDocPhone = String(
    student?.parentPhone ||
    student?.mobileNumber ||
    student?.phone ||
    student?.phoneNumber ||
    student?.contactNumber ||
    student?.parentContact ||
    student?.fatherPhone ||
    student?.motherPhone ||
    ''
  ).trim();
  const resolvedPhone = studentDocPhone || '';

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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/teacher/students');
    }
  };

  const renderPageHeader = (title, rightAction = null) => (
    <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
      <Button startIcon={<BackIcon />} onClick={handleBack}>
        Back
      </Button>
      <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Box sx={{ minWidth: 90, textAlign: 'right' }}>{rightAction}</Box>
    </Paper>
  );

  useEffect(() => {
    if (!studentId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    let unsubscribe;

    const q = query(collection(db, 'students'), where('studentId', '==', studentId));
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const rawData = snapshot.docs[0].data();
            loadStudentData({ id: snapshot.docs[0].id, ...rawData });
        } else {
             const docRef = doc(db, 'students', studentId);
             onSnapshot(docRef, (docSnap) => {
                 if (docSnap.exists()) {
                     loadStudentData({ id: docSnap.id, ...docSnap.data() });
                 } else {
                     setStudent(null);
                     setLoading(false);
                 }
             });
        }
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [studentId]);

  const loadStudentData = (data) => {
     const calculatedPoints = calculateDollarPoints(data);
     const completeData = { ...data, dollarPoints: calculatedPoints };
     setStudent(completeData);
     
     // Unify Attendance
     const byDate = completeData.attendanceByDate || {};
     const legacyPresent = completeData.attendance || [];
     const legacyAbsent = completeData.absentDates || [];
     
     const attendanceMap = new Map();
     
     // 1. Load legacy present
     legacyPresent.forEach(entry => {
       const [dateStr, teacherName] = typeof entry === 'string' ? entry.split('::') : [entry, 'Unknown'];
       if (dateStr) {
         attendanceMap.set(dateStr, {
           date: dateStr,
           status: 'present',
           markedBy: teacherName || 'Unknown',
           markedAt: null
         });
       }
     });

     // 2. Load legacy absent
     legacyAbsent.forEach(entry => {
       const [dateStr, teacherName] = typeof entry === 'string' ? entry.split('::') : [entry, 'Unknown'];
       if (dateStr) {
         attendanceMap.set(dateStr, {
           date: dateStr,
           status: 'absent',
           markedBy: teacherName || 'Unknown',
           markedAt: null
         });
       }
     });

     // 3. Override with new structured map
     Object.entries(byDate).forEach(([dateStr, record]) => {
        attendanceMap.set(dateStr, {
           date: dateStr,
           status: record.status,
           markedBy: record.teacherName || 'Unknown',
           markedAt: record.updatedAt?.toDate ? record.updatedAt.toDate() : null
        });
     });

     const unified = Array.from(attendanceMap.values()).sort((a, b) => b.date.localeCompare(a.date));
     setUnifiedAttendance(unified);

     // Process Rewards
     const rewardsList = completeData.rewards || [];
     rewardsList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
     setRewards(rewardsList);
     setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
        setSearchParams({ id: searchInput.trim() });
    }
  };

  const handleEditClick = () => {
    setEditData({
      name: student.name || '',
      studentId: student.studentId || '',
      classType: student.classType || '',
      location: student.location || student.place || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      parentPhone: resolvedPhone || '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'students', student.id);
      await updateDoc(docRef, {
        name: editData.name,
        studentId: editData.studentId,
        classType: editData.classType,
        location: editData.location,
        place: editData.location,
        fatherName: editData.fatherName,
        motherName: editData.motherName,
        parentPhone: editData.parentPhone,
        mobileNumber: editData.parentPhone
      });
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error updating student: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- DERIVED METRICS ---
  const totalClasses = unifiedAttendance.length;
  const presentClasses = unifiedAttendance.filter(r => r.status === 'present').length;
  const absentClasses = unifiedAttendance.filter(r => r.status === 'absent').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...unifiedAttendance].sort((a, b) => b.date.localeCompare(a.date)); // descending
    const today = format(new Date(), 'yyyy-MM-dd');
    for (let record of sorted) {
      if (record.date <= today) {
        if (record.status === 'present') streak++;
        else if (record.status === 'absent') break;
      }
    }
    return streak;
  }, [unifiedAttendance]);

  // --- FILTERS ---
  const filteredAttendance = useMemo(() => {
    return unifiedAttendance.filter(record => {
      // Status Filter
      if (statusFilter !== 'All' && record.status !== statusFilter.toLowerCase()) return false;
      
      // Date Filter
      if (dateFilter !== 'All') {
        const recordDate = parseISO(record.date);
        if (dateFilter === 'Today' && !isToday(recordDate)) return false;
        if (dateFilter === 'This Week' && !isThisWeek(recordDate)) return false;
        if (dateFilter === 'This Month' && !isThisMonth(recordDate)) return false;
      }

      // Search Filter
      if (attendanceSearch) {
        const searchLower = attendanceSearch.toLowerCase();
        const matchDate = record.date.includes(searchLower);
        const matchTeacher = record.markedBy.toLowerCase().includes(searchLower);
        const matchStatus = record.status.toLowerCase().includes(searchLower);
        if (!matchDate && !matchTeacher && !matchStatus) return false;
      }
      return true;
    });
  }, [unifiedAttendance, statusFilter, dateFilter, attendanceSearch]);

  const absentRecords = unifiedAttendance.filter(r => r.status === 'absent').sort((a, b) => b.date.localeCompare(a.date));

  // --- CALENDAR HELPERS ---
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const dateFormat = "d";
    
    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Day headers
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <PrevIcon />
          </IconButton>
          <Typography fontWeight="bold">{format(currentMonth, 'MMMM yyyy')}</Typography>
          <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <NextIcon />
          </IconButton>
        </Box>
        <Grid container spacing={1}>
          {weekDays.map(wd => (
            <Grid item xs={12/7} key={wd} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">{wd}</Typography>
            </Grid>
          ))}
          {daysInterval.map((currentDay, idx) => {
            const dateStr = format(currentDay, 'yyyy-MM-dd');
            const record = unifiedAttendance.find(r => r.date === dateStr);
            const isCurrentMonth = isSameMonth(currentDay, monthStart);
            
            let dotColor = 'transparent';
            if (record?.status === 'present') dotColor = theme.palette.success.main;
            else if (record?.status === 'absent') dotColor = theme.palette.error.main;

            return (
              <Grid item xs={12/7} key={idx} sx={{ textAlign: 'center', p: 0.5 }}>
                <Box 
                  onClick={() => record && setSelectedRecord(record)}
                  sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: isCurrentMonth ? 'background.paper' : 'rgba(0,0,0,0.02)',
                    color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: record ? 'pointer' : 'default',
                    '&:hover': record ? { bgcolor: 'action.hover' } : {}
                  }}
                >
                  <Typography variant="body2">{format(currentDay, dateFormat)}</Typography>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor, mx: 'auto', mt: 0.5 }} />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderSearchBar = () => (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 60, color: '#4facfe', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight="bold">Find Student</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter a Student ID to view their full profile and history.
        </Typography>
        <form onSubmit={handleSearch}>
            <TextField 
                fullWidth 
                label="Enter Student ID" 
                variant="outlined"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleSearch} edge="end">
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2, bgcolor: '#4facfe', height: 50 }}
            >
                Search Profile
            </Button>
        </form>
    </Paper>
  );

  // --- MAIN RENDER ---

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!studentId) {
      return (
        <Box sx={{ p: 2 }}>
            {renderPageHeader('Student Details')}
            {renderSearchBar()}
        </Box>
      );
  }

  if (studentId && !student) {
    return (
      <Box sx={{ p: 2 }}>
        {renderPageHeader('Student Details', (
          <Button size="small" startIcon={<SearchIcon />} onClick={() => setSearchParams({})}>
            Search
          </Button>
        ))}
        <Alert severity="error">Student with ID "{studentId}" not found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: 2 }}>
      {renderPageHeader('Student Profile', (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {isAdmin && (
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={handleEditClick}>
              Edit
            </Button>
          )}
          <Button size="small" startIcon={<SearchIcon />} onClick={() => setSearchParams({})}>
            Search
          </Button>
        </Box>
      ))}

      {/* Content Grid */}
      <Grid container spacing={2}>
        
        {/* 1. Left Col: Personal Info */}
        <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} /> Personal Information
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body1" fontWeight="bold">{student.name}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">ID</Typography><Typography variant="body1"><code>{student.studentId}</code></Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Class</Typography><br /><Chip label={student.classType} size="small" color="primary" variant="outlined" /></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{student.location || student.place || '-'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Father</Typography><Typography variant="body1">{student.fatherName || '-'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Mother</Typography><Typography variant="body1">{student.motherName || '-'}</Typography></Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Parent Phone</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {resolvedPhone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      size="small"
                      startIcon={<PhoneIcon />}
                      disabled={!resolvedPhone}
                      onClick={() => {
                        const raw = String(resolvedPhone).trim();
                        const phone = raw.replace(/[^\d+]/g, '');
                        if (phone) window.open(`tel:${phone}`, '_self');
                      }}
                      sx={{ mt: 2 }}
                    >
                      Call Parent
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
        </Grid>

        {/* 2. Right Col: Performance */}
        <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <DollarIcon sx={{ mr: 1, color: 'success.main' }} /> Performance
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                     <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.1)' : '#f0fdf4', textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Dollar Points</Typography>
                        <Typography variant="h4" color="success.main" fontWeight="bold">${student.dollarPoints}</Typography>
                     </Paper>
                  </Grid>
                  <Grid item xs={6}>
                     <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,152,0,0.1)' : '#fff7ed', textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Streak</Typography>
                        <Typography variant="h4" color="warning.main" fontWeight="bold">{currentStreak} 🔥</Typography>
                     </Paper>
                  </Grid>
                  <Grid item xs={12}>
                     <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Grid container>
                            <Grid item xs={6}>
                                <Typography variant="caption">Attendance</Typography>
                                <Typography variant="h6">{presentClasses} Days</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption">Attendance Rate</Typography>
                                <Typography variant="h6">{attendanceRate}%</Typography>
                            </Grid>
                        </Grid>
                     </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
        </Grid>

        {/* 3. NEW: Attendance Records */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttendanceIcon sx={{ mr: 1, color: 'primary.main' }} /> Attendance Records
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
                {/* Attendance Summary */}
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Attendance Summary</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Classes:</Typography>
                      <Typography variant="body2" fontWeight="bold">{totalClasses}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Present:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">{presentClasses}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Absent:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">{absentClasses}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Attendance Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold">{attendanceRate}%</Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Absent Dates Summary */}
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(211,47,47,0.05)', borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>Absent Dates</Typography>
                    {absentRecords.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No absences recorded.</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {absentRecords.map(record => (
                          <Chip 
                            key={record.date} 
                            label={format(parseISO(record.date), 'MMM d')} 
                            size="small" 
                            color="error" 
                            variant="outlined"
                            onClick={() => setSelectedRecord(record)}
                            sx={{ cursor: 'pointer', bgcolor: 'white' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Calendar */}
                <Grid item xs={12} md={4}>
                   <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, height: '100%' }}>
                      {renderCalendar()}
                   </Paper>
                </Grid>
              </Grid>

              {/* Filters & Search */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Present">Present</MenuItem>
                    <MenuItem value="Absent">Absent</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Date</InputLabel>
                  <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
                    <MenuItem value="All">All Time</MenuItem>
                    <MenuItem value="Today">Today</MenuItem>
                    <MenuItem value="This Week">This Week</MenuItem>
                    <MenuItem value="This Month">This Month</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  size="small" 
                  placeholder="Search attendance..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  }}
                  sx={{ flexGrow: 1 }}
                />
              </Box>

              {/* Attendance Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Day</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Marked By</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Marked At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">No attendance records found.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendance.map((record) => {
                        const rDate = parseISO(record.date);
                        return (
                          <TableRow 
                            key={record.date} 
                            hover 
                            onClick={() => setSelectedRecord(record)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{format(rDate, 'yyyy-MM-dd')}</TableCell>
                            <TableCell>{format(rDate, 'EEEE')}</TableCell>
                            <TableCell>
                              <Chip 
                                icon={record.status === 'present' ? <PresentIcon /> : <AbsentIcon />}
                                label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                color={record.status === 'present' ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell>{record.markedBy}</TableCell>
                            <TableCell>{record.markedAt ? format(record.markedAt, 'hh:mm a') : '—'}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

            </CardContent>
          </Card>
        </Grid>

        {/* 4. Bottom Col: Rewards History */}
        <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'action.active' }} /> Reward History
                </Typography>
                {rewards.length === 0 ? (
                  <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center', py: 4 }}>No rewards recorded yet</Typography>
                ) : isMobile ? (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {rewards.map((reward, index) => (
                      <Card key={index} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="caption" color="text.secondary">{reward.date || 'N/A'}</Typography>
                            <Typography fontWeight="bold" color="success.main">+${reward.dollars}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1.5, wordBreak: 'break-word' }}>
                            {reward.reason || '-'}
                          </Typography>
                          <Box display="flex" justifyContent="flex-end">
                            <Chip label={reward.teacher || 'Unknown'} size="small" variant="outlined" />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ bgcolor: 'background.paper' }}>Date</TableCell>
                          <TableCell sx={{ bgcolor: 'background.paper' }}>Amount</TableCell>
                          <TableCell sx={{ bgcolor: 'background.paper' }}>Reason</TableCell>
                          <TableCell sx={{ bgcolor: 'background.paper' }}>Teacher</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rewards.map((reward, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{reward.date || 'N/A'}</TableCell>
                            <TableCell><Typography fontWeight="bold" color="success.main">+${reward.dollars}</Typography></TableCell>
                            <TableCell>{reward.reason || '-'}</TableCell>
                            <TableCell>{reward.teacher || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
        </Grid>

      </Grid>

      {/* Edit Dialog for Admins */}
      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Student Details</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Full Name" 
                fullWidth 
                value={editData.name || ''} 
                onChange={(e) => setEditData({...editData, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Student ID" 
                fullWidth 
                value={editData.studentId || ''} 
                onChange={(e) => setEditData({...editData, studentId: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Class" 
                fullWidth 
                select
                value={editData.classType || ''} 
                onChange={(e) => setEditData({...editData, classType: e.target.value})}
              >
                {['Beginner', 'Primary', 'Secondary'].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Location" 
                fullWidth 
                select
                value={editData.location || ''} 
                onChange={(e) => setEditData({...editData, location: e.target.value})}
              >
                {['Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Father's Name" 
                fullWidth 
                value={editData.fatherName || ''} 
                onChange={(e) => setEditData({...editData, fatherName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Mother's Name" 
                fullWidth 
                value={editData.motherName || ''} 
                onChange={(e) => setEditData({...editData, motherName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Parent Phone Number" 
                fullWidth 
                type="tel"
                value={editData.parentPhone || ''} 
                onChange={(e) => setEditData({...editData, parentPhone: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Details Modal */}
      <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttendanceIcon color="primary" /> Attendance Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              <Typography variant="body1"><strong>Student:</strong> {student?.name}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}><strong>Student ID:</strong> {student?.studentId}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1"><strong>Date:</strong> {format(parseISO(selectedRecord.date), 'MMMM d, yyyy')}</Typography>
              <Typography variant="body1"><strong>Day:</strong> {format(parseISO(selectedRecord.date), 'EEEE')}</Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                <strong>Status:</strong> 
                <Chip 
                    icon={selectedRecord.status === 'present' ? <PresentIcon /> : <AbsentIcon />}
                    label={selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                    color={selectedRecord.status === 'present' ? 'success' : 'error'}
                    size="small"
                />
              </Typography>
              <Typography variant="body1"><strong>Marked By:</strong> {selectedRecord.markedBy}</Typography>
              <Typography variant="body1"><strong>Marked At:</strong> {selectedRecord.markedAt ? format(selectedRecord.markedAt, 'hh:mm a') : '—'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDetailsPage;