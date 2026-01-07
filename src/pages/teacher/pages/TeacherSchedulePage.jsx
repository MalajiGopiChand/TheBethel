import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowLeft as PrevIcon,
  KeyboardArrowRight as NextIcon
} from '@mui/icons-material';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// Helper function to get this Sunday
const getThisSunday = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day; // days to subtract to get Sunday
  const sunday = new Date(today.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};

// Helper function to check if two timestamps are the same day
const isSameDayTimestamp = (timestamp1, timestamp2) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return isSameDay(date1, date2);
};

const TeacherSchedulePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [currentWeekSunday, setCurrentWeekSunday] = useState(getThisSunday());
  const [formData, setFormData] = useState({
    className: '',
    assignedPersonName: '',
    assignedWork: '',
    place: 'Kandrika',
    date: getThisSunday().getTime()
  });

  const isAdmin = currentUser?.role === 'ADMIN' || 
    currentUser?.email === 'gop1@gmail.com' || 
    currentUser?.email === 'premkumartenali@gmail.com';

  useEffect(() => {
    // Real-time listener for timetables
    const timetablesQuery = query(collection(db, 'timetables'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(timetablesQuery, (snapshot) => {
      const timetablesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date || data.createdAt || 0
        };
      });
      setTimetables(timetablesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching timetables:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter timetables for current Sunday
  const currentSundaySchedules = timetables.filter(timetable => {
    if (!timetable.date) return false;
    let dateValue;
    if (typeof timetable.date === 'object' && timetable.date.toDate) {
      dateValue = timetable.date.toDate().getTime();
    } else if (typeof timetable.date === 'number') {
      dateValue = timetable.date;
    } else {
      return false;
    }
    return isSameDayTimestamp(dateValue, currentWeekSunday.getTime());
  }).sort((a, b) => {
    // Sort by place, then by className
    const placeCompare = (a.place || '').localeCompare(b.place || '');
    if (placeCompare !== 0) return placeCompare;
    return (a.className || '').localeCompare(b.className || '');
  });

  // Group by place
  const schedulesByPlace = currentSundaySchedules.reduce((acc, schedule) => {
    const place = schedule.place || 'Other';
    if (!acc[place]) acc[place] = [];
    acc[place].push(schedule);
    return acc;
  }, {});

  const handleOpenDialog = (timetable) => {
    if (timetable) {
      setEditingTimetable(timetable);
      let dateValue = currentWeekSunday.getTime();
      if (timetable.date) {
        if (typeof timetable.date === 'object' && timetable.date.toDate) {
          dateValue = timetable.date.toDate().getTime();
        } else if (typeof timetable.date === 'number') {
          dateValue = timetable.date;
        }
      }
      setFormData({
        className: timetable.className || '',
        assignedPersonName: timetable.assignedPersonName || '',
        assignedWork: timetable.assignedWork || '',
        place: timetable.place || 'Kandrika',
        date: dateValue
      });
    } else {
      setEditingTimetable(null);
      setFormData({
        className: '',
        assignedPersonName: '',
        assignedWork: '',
        place: 'Kandrika',
        date: currentWeekSunday.getTime()
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTimetable(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.className || !formData.assignedPersonName || !formData.place) {
        alert('Please fill in all required fields');
        return;
      }

      const timetableData = {
        className: formData.className,
        assignedPersonName: formData.assignedPersonName,
        assignedWork: formData.assignedWork || '',
        place: formData.place,
        day: 'Sunday',
        date: formData.date,
        createdAt: editingTimetable ? editingTimetable.createdAt : serverTimestamp()
      };

      if (editingTimetable) {
        await updateDoc(doc(db, 'timetables', editingTimetable.id), timetableData);
      } else {
        await addDoc(collection(db, 'timetables'), timetableData);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Failed to save schedule: ' + error.message);
    }
  };

  const handleDelete = async (timetableId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'timetables', timetableId));
    } catch (error) {
      console.error('Error deleting timetable:', error);
      alert('Failed to delete schedule: ' + error.message);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekSunday(subWeeks(currentWeekSunday, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekSunday(addWeeks(currentWeekSunday, 1));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/dashboard')} size="small">
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' }, fontWeight: 'bold' }}>
            Sunday Schedules
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog(null)}
              size="small"
            >
              Add Schedule
            </Button>
          )}
        </Box>

        {/* Week Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <IconButton onClick={handlePreviousWeek} size="small">
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', flexGrow: 1 }}>
            Week of {format(currentWeekSunday, 'MMM dd, yyyy')}
          </Typography>
          <IconButton onClick={handleNextWeek} size="small">
            <NextIcon />
          </IconButton>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, sm: 2 } }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : currentSundaySchedules.length === 0 ? (
          <Alert severity="info">No schedules found for this Sunday.</Alert>
        ) : (
          <Box>
            {Object.entries(schedulesByPlace).map(([place, schedules]) => (
              <Box key={place} sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, px: { xs: 1, sm: 2 } }}>
                  {place}
                </Typography>
                <Grid container spacing={2}>
                  {schedules.reduce((acc, schedule) => {
                    const className = schedule.className || 'Unknown';
                    if (!acc.find(g => g.className === className)) {
                      acc.push({ className, schedules: schedules.filter(s => s.className === className) });
                    }
                    return acc;
                  }, []).map(({ className, schedules: classSchedules }) => (
                    <Grid item xs={12} sm={6} md={4} key={className}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                            {className}
                          </Typography>
                          {classSchedules.map((schedule) => (
                            <Box key={schedule.id} sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Teacher: {schedule.assignedPersonName}
                              </Typography>
                              {schedule.assignedWork && (
                                <Typography variant="body2" color="text.secondary">
                                  Task: {schedule.assignedWork}
                                </Typography>
                              )}
                              {isAdmin && (
                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(schedule)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(schedule.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                              {classSchedules.indexOf(schedule) < classSchedules.length - 1 && (
                                <Divider sx={{ mt: 1 }} />
                              )}
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTimetable ? 'Edit Schedule' : 'Add Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Class Name</InputLabel>
              <Select
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                label="Class Name"
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Primary">Primary</MenuItem>
                <MenuItem value="Secondary">Secondary</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Teacher Name"
              value={formData.assignedPersonName}
              onChange={(e) => setFormData({ ...formData, assignedPersonName: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Task / Subject"
              value={formData.assignedWork}
              onChange={(e) => setFormData({ ...formData, assignedWork: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                label="Location"
              >
                <MenuItem value="Kandrika">Kandrika</MenuItem>
                <MenuItem value="Krishna Lanka">Krishna Lanka</MenuItem>
                <MenuItem value="Gandhiji Conly">Gandhiji Conly</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Date"
              type="date"
              value={format(new Date(formData.date), 'yyyy-MM-dd')}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                selectedDate.setHours(0, 0, 0, 0);
                setFormData({ ...formData, date: selectedDate.getTime() });
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTimetable ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherSchedulePage;

