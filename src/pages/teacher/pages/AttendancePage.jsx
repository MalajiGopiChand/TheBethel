import { attendanceUpdate, savedAttendance } from '../../../utils/attendanceSave';
import SchoolLoader from '../../../components/SchoolLoader';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
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
  Stack
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  LogoutRounded as LogoutIcon
} from '@mui/icons-material';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  mutateStudents,
  deleteField,
  serverTimestamp
} from '../../../services/studentData';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { notifySuccess, notifyError, requestNotificationPermission } from '../../../services/notificationService';

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
  const [dateParams, setDateParams] = useSearchParams();
  const candidateDate = dateParams.get('date') || '';
  const attendanceDate = /^\d{4}-\d{2}-\d{2}$/.test(candidateDate) && !Number.isNaN(new Date(candidateDate).getTime()) ? candidateDate : format(new Date(), 'yyyy-MM-dd');
  // Local state per student for the selected date: 'present' | 'absent' | null (unmarked)
  const [attendance, setAttendance] = useState({});
  const [expectedStatuses, setExpectedStatuses] = useState({});
  useEffect(() => { setAttendance({}); setExpectedStatuses({}); }, [attendanceDate]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  // Fetch Students
  useEffect(() => {
    setLoading(true); setLoadError('');
    requestNotificationPermission();
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
      setLoading(false);
    }, () => { setLoading(false); setLoadError('Unable to load students. Retry before saving attendance.'); });

    return () => unsubscribe();
  }, [retry]);

  const getSavedStatusForDate = savedAttendance;

  const getSavedTeacherForDate = (student, dateStr) => {
    const byDate = student.attendanceByDate || {};
    const record = byDate?.[dateStr];
    if (record?.teacherName) return record.teacherName;

    // Legacy format: "yyyy-MM-dd::Teacher Name"
    const attendance = student.attendance || [];
    const absentDates = student.absentDates || [];
    const presentLegacy = attendance.find((v) => typeof v === 'string' && v.startsWith(`${dateStr}::`));
    if (presentLegacy) return presentLegacy.split('::').slice(1).join('::') || '';
    const absentLegacy = absentDates.find((v) => typeof v === 'string' && v.startsWith(`${dateStr}::`));
    if (absentLegacy) return absentLegacy.split('::').slice(1).join('::') || '';
    return '';
  };

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
      (student.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return classFilter && placeFilter && searchFilter;
  });

  // Only unsaved edits live here. Saved values always come from the latest snapshot.

  // Save Handler (internal, called by handleSaveWithCheck)
  const handleSave = async () => {
    if (saving || loading || loadError || !currentUser?.uid) return;
    try {
      setSaving(true);
      const dateStr = attendanceDate;
      const teacherName =
        currentUser?.displayName ||
        currentUser?.name ||
        currentUser?.email ||
        'Unknown';

      const changes = filteredStudents.flatMap(student => {
        if (!Object.prototype.hasOwnProperty.call(attendance, student.id)) return [];
        const status = attendance[student.id];
        const expected = Object.prototype.hasOwnProperty.call(expectedStatuses, student.id) ? expectedStatuses[student.id] : getSavedStatusForDate(student, dateStr);
        if (status === expected) return [];
        return [[doc(db, 'students', student.id), fresh => attendanceUpdate(fresh, {
          date: dateStr, status, expected, teacher: { uid: currentUser.uid, name: teacherName },
          updatedAt: serverTimestamp(), removed: deleteField()
        })]];
      });
      const markedCount = filteredStudents.filter(student => Object.prototype.hasOwnProperty.call(attendance, student.id) && attendance[student.id] && attendance[student.id] !== getSavedStatusForDate(student, dateStr)).length;
      const sessions = markedCount > 0 && currentUser.role === 'TEACHER' ? [[doc(db, 'teachers', currentUser.uid), {
        [`attendanceSessions.${dateStr}`]: { marked: true, date: dateStr, markedAt: serverTimestamp(), changedRecords: markedCount, place: selectedPlace, classType: selectedClass }
      }]] : [];
      await mutateStudents(changes, sessions);
      setAttendance(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !filteredStudents.some(student => student.id === id))));
      setExpectedStatuses(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !filteredStudents.some(student => student.id === id))));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      notifySuccess('Attendance saved', `Saved attendance for ${format(new Date(dateStr), 'MMM d, yyyy')}.`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      notifyError('Attendance failed', error.message || 'Failed to save attendance.');
      alert('Failed to save attendance: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
    setExpectedStatuses(previous => ({ ...previous, ...Object.fromEntries(filteredStudents.map(student => [student.id, getSavedStatusForDate(student, attendanceDate)])) }));
  };
  const markStudent = (student, status) => {
    setExpectedStatuses(previous => ({ ...previous, [student.id]: getSavedStatusForDate(student, attendanceDate) }));
    setAttendance(previous => ({ ...previous, [student.id]: status }));
  };

  // Stats
  const draftStatus = student => Object.prototype.hasOwnProperty.call(attendance, student.id) ? attendance[student.id] : getSavedStatusForDate(student, attendanceDate);
  const currentPresentCount = filteredStudents.filter(student => draftStatus(student) === 'present').length;
  const currentAbsentCount = filteredStudents.filter(student => draftStatus(student) === 'absent').length;

  // Check if selected date is Sunday (0 = Sunday)
  const isSelectedDateSunday = new Date(attendanceDate).getDay() === 0;

  // Save Handler - Add Sunday check
  const handleSaveWithCheck = async () => {
    if (!isSelectedDateSunday) {
      alert('Attendance can only be updated for Sundays. Please select a Sunday date.');
      return;
    }
    await handleSave();
  };

  return (
    <Box className="admin-page" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      
      {/* 1. Header & Filters (Sticky) */}
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
              Mark Attendance
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={saving ? <SchoolLoader inline /> : <SaveIcon />}
                onClick={handleSaveWithCheck} 
                disabled={saving || !isSelectedDateSunday}
                sx={{ borderRadius: 999, fontWeight: 'bold', px: { xs: 2 }, boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
        </Toolbar>
      </AppBar>

      {/* Main Page Content */}
      <Container maxWidth="lg" sx={{ pt: 3, pb: 12 }}>
          
          {/* Quick Stats Bar */}
          <Box className="attendance-quick-stats" sx={{ display: 'flex', mb: 3, p: 2, bgcolor: 'white', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
             <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Total</Typography>
                <Typography variant="h5" fontWeight="900" color="primary.main" sx={{ mt: 0.5 }}>{filteredStudents.length}</Typography>
             </Box>
             <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.6 }} />
             <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <PresentIcon fontSize="small" />
                    <Typography variant="caption" fontWeight="800" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Present</Typography>
                </Box>
                <Typography variant="h5" fontWeight="900" sx={{ mt: 0.5 }}>{currentPresentCount}</Typography>
             </Box>
             <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.6 }} />
             <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'error.main' }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <AbsentIcon fontSize="small" />
                    <Typography variant="caption" fontWeight="800" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Absent</Typography>
                </Box>
                <Typography variant="h5" fontWeight="900" sx={{ mt: 0.5 }}>{currentAbsentCount}</Typography>
             </Box>
          </Box>

          {/* Scrollable Filters */}
          <Box className="attendance-filters" sx={{ gap: 1.5, pb: 2, mb: 1 }}>
            <TextField
              type="date"
              size="small"
              value={attendanceDate}
              onChange={(e) => { setAttendance({}); setExpectedStatuses({}); setDateParams({ date: e.target.value }); }}
              sx={{ minWidth: 150, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}
            />
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

      {/* 2. Warning Alert for Non-Sunday */}
      {!isSelectedDateSunday && (
        <Alert severity="warning" sx={{ mx: 2, mt: 2, mb: 0 }}>
          Attendance can only be updated for Sundays. The selected date is {format(new Date(attendanceDate), 'EEEE, MMM dd, yyyy')}.
        </Alert>
      )}

      {/* 3. Success Alert */}
      {showSuccess && <Alert severity="success" sx={{ mt: 2, mb: 2 }}>Attendance saved successfully!</Alert>}

      {/* 4. Student List */}
        {loadError && <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{loadError}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><SchoolLoader /></Box>
        ) : filteredStudents.length === 0 ? (
          <Alert severity="info">No students match your filters.</Alert>
        ) : (
          <Paper className="attendance-student-list" elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mt: 2 }}>
            <List disablePadding>
              {filteredStudents.map((student, index) => {
                const savedStatus = getSavedStatusForDate(student, attendanceDate);
                const savedTeacher = getSavedTeacherForDate(student, attendanceDate);
                const localStatus =
                  Object.prototype.hasOwnProperty.call(attendance, student.id)
                    ? attendance[student.id]
                    : savedStatus;
                const effectiveStatus = localStatus;
                const isPresent = effectiveStatus === 'present';
                const isAbsent = effectiveStatus === 'absent';
                
                return (
                  <React.Fragment key={student.id}>
                    <ListItem 
                      sx={{ 
                        bgcolor: isAbsent ? '#fff5f5' : isPresent ? 'white' : 'grey.50',
                        transition: 'background-color 0.3s',
                        '&:hover': { bgcolor: isAbsent ? '#ffebeb' : 'grey.50' }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: isAbsent
                            ? theme.palette.error.main
                            : isPresent
                            ? theme.palette.primary.main
                            : theme.palette.grey[600],
                          width: 40, height: 40, mr: 2, fontSize: '0.9rem'
                        }}
                      >
                        {student.name.charAt(0)}
                      </Avatar>
                      
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" fontWeight="bold" color={isAbsent ? 'error.main' : 'text.primary'}>
                            {student.name}
                          </Typography>
                        }
                        secondary={`${student.studentId} • ${student.location || student.place || 'No Location'}`}
                      />
                      
                      <Box className="attendance-row-actions">
                        <Stack direction="row" spacing={1} alignItems="center">
                          {savedStatus && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color={savedStatus === 'present' ? 'success' : 'error'}
                              label={savedTeacher ? `Saved ${savedStatus.toUpperCase()} • ${savedTeacher}` : `Saved ${savedStatus.toUpperCase()}`}
                            />
                          )}
                          <Button
                            size="small"
                            variant={isAbsent ? 'contained' : 'outlined'}
                            color="error"
                            disabled={!isSelectedDateSunday}
                            onClick={() => markStudent(student, isAbsent ? null : 'absent')}
                            sx={{ minWidth: 80, borderRadius: 2 }}
                          >
                            Absent
                          </Button>
                          <Button
                            size="small"
                            variant={effectiveStatus === null ? 'contained' : 'outlined'}
                            disabled={!isSelectedDateSunday}
                            onClick={() => markStudent(student, null)}
                            sx={{ minWidth: 80, borderRadius: 2 }}
                          >
                            Unmark
                          </Button>
                          <Button
                            size="small"
                            variant={isPresent ? 'contained' : 'outlined'}
                            color="success"
                            disabled={!isSelectedDateSunday}
                            onClick={() => markStudent(student, isPresent ? null : 'present')}
                            sx={{ minWidth: 80, borderRadius: 2 }}
                          >
                            Present
                          </Button>
                        </Stack>
                      </Box>
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
