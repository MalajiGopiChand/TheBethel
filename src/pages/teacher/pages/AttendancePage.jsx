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
  writeBatch,
  deleteField,
  serverTimestamp
} from 'firebase/firestore';
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
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  // Local state per student for the selected date: 'present' | 'absent' | null (unmarked)
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

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

  const getSavedStatusForDate = (student, dateStr) => {
    const byDate = student.attendanceByDate || {};
    const record = byDate?.[dateStr];
    if (record?.status === 'present' || record?.status === 'absent') return record.status;

    // Backward compatibility: legacy arrays without teacher name
    const attendanceList = student.attendance || [];
    const absentDates = student.absentDates || [];
    if (attendanceList.includes(dateStr)) return 'present';
    if (absentDates.includes(dateStr)) return 'absent';
    return null;
  };

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
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return classFilter && placeFilter && searchFilter;
  });

  // Keep local state in sync with saved records without overwriting user edits
  useEffect(() => {
    if (loading) return;
    setAttendance((prev) => {
      const next = { ...prev };
      for (const s of filteredStudents) {
        if (Object.prototype.hasOwnProperty.call(prev, s.id)) continue;
        next[s.id] = getSavedStatusForDate(s, attendanceDate);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, attendanceDate, filteredStudents.length]);

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

  // Save Handler (internal, called by handleSaveWithCheck)
  const handleSave = async () => {
    try {
      setSaving(true);
      const dateStr = attendanceDate;
      const teacherName =
        currentUser?.displayName ||
        currentUser?.name ||
        currentUser?.email ||
        'Unknown';

      const batch = writeBatch(db);
      for (const student of filteredStudents) {
        const status = attendance[student.id] ?? getSavedStatusForDate(student, dateStr);
        const studentRef = doc(db, 'students', student.id);

        // Always store the canonical one-record-per-day structure:
        // attendanceByDate[yyyy-MM-dd] = { status, teacherName, updatedAt }
        if (status === 'present' || status === 'absent') {
          batch.update(studentRef, {
            [`attendanceByDate.${dateStr}`]: {
              status,
              teacherName,
              updatedAt: serverTimestamp()
            }
          });
        } else {
          // Unmark -> remove the record for that date
          batch.update(studentRef, {
            [`attendanceByDate.${dateStr}`]: deleteField()
          });
        }

        // Keep legacy arrays consistent (so old parts of app keep working)
        // by removing that date from both and re-adding based on status.
        const legacyAttendance = (student.attendance || []).filter((d) => d !== dateStr);
        const legacyAbsent = (student.absentDates || []).filter((d) => d !== dateStr);
        if (status === 'present') legacyAttendance.push(dateStr);
        if (status === 'absent') legacyAbsent.push(dateStr);

        const sortedAttendance = [...legacyAttendance].sort();
        const newStreak = status === 'present' ? calculateStreak(sortedAttendance, dateStr) : 0;

        batch.update(studentRef, {
          attendance: legacyAttendance,
          absentDates: legacyAbsent,
          currentStreak: newStreak,
          dollarPoints: student.dollarPoints || 0
        });
      }

      await batch.commit();

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
  };

  // Stats
  const currentPresentCount = Object.values(attendance).filter(v => v === 'present').length;
  const currentAbsentCount = Object.values(attendance).filter(v => v === 'absent').length;

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
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Daily Attendance
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveWithCheck} 
                disabled={saving || !isSelectedDateSunday}
                sx={{ borderRadius: 2 }}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
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

      {/* 2. Warning Alert for Non-Sunday */}
      {!isSelectedDateSunday && (
        <Alert severity="warning" sx={{ mx: 2, mt: 2, mb: 0 }}>
          Attendance can only be updated for Sundays. The selected date is {format(new Date(attendanceDate), 'EEEE, MMM dd, yyyy')}.
        </Alert>
      )}

      {/* 3. Success Alert */}
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
                const savedStatus = getSavedStatusForDate(student, attendanceDate);
                const savedTeacher = getSavedTeacherForDate(student, attendanceDate);
                const localStatus =
                  Object.prototype.hasOwnProperty.call(attendance, student.id)
                    ? attendance[student.id]
                    : savedStatus;
                const effectiveStatus = localStatus ?? savedStatus ?? null;
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
                        secondary={`${student.studentId} • ${student.location || 'No Location'}`}
                      />
                      
                      <ListItemSecondaryAction>
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
                            onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: isAbsent ? null : 'absent' }))}
                            sx={{ minWidth: 80, borderRadius: 2 }}
                          >
                            Absent
                          </Button>
                          <Button
                            size="small"
                            variant={effectiveStatus === null ? 'contained' : 'outlined'}
                            disabled={!isSelectedDateSunday}
                            onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: null }))}
                            sx={{ minWidth: 80, borderRadius: 2 }}
                          >
                            Unmark
                          </Button>
                          <Button
                            size="small"
                            variant={isPresent ? 'contained' : 'outlined'}
                            color="success"
                            disabled={!isSelectedDateSunday}
                            onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: isPresent ? null : 'present' }))}
                            sx={{ minWidth: 80, borderRadius: 2 }}
                          >
                            Present
                          </Button>
                        </Stack>
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
