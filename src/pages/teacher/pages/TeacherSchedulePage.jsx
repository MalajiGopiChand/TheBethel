import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
  Box,
  Paper,
  AppBar,
  Toolbar,
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
  KeyboardArrowRight as NextIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { format, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { notifyError, notifySuccess } from '../../../services/notificationService';

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

// Grid Component for Image Generation
const ScheduleGridView = ({ place, schedules, dateStr, isAdmin, onEdit, onDelete }) => {
  const gridRef = useRef(null);
  
  const downloadImage = async () => {
    if (!gridRef.current) return;
    try {
      const canvas = await html2canvas(gridRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${place}-Schedule-${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    }
  };

  const serviceTypes = ['FIRST SERVICE', 'SECOND SERVICE'];
  const classTypes = ['PRE - SCHOOL', 'JUNIORS', 'SENIORS'];

  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: { xs: 1, sm: 2 } }}>
         <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{place}</Typography>
         <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadImage}>Download Image</Button>
      </Box>
      
      <Box sx={{ overflowX: 'auto', p: { xs: 1, sm: 2 } }}>
         <Box ref={gridRef} sx={{ display: 'inline-block', bgcolor: 'white', p: 2 }}>
           <table style={{ borderCollapse: 'collapse', minWidth: '700px', border: '1.5px solid black', fontFamily: 'serif' }}>
               <thead>
                   <tr>
                       <th colSpan={4} style={{ border: '1.5px solid black', padding: '8px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                          {dateStr}
                       </th>
                   </tr>
                   <tr>
                       <th style={{ border: '1.5px solid black', padding: '8px', width: '180px' }}></th>
                       {classTypes.map(c => (
                           <th key={c} style={{ border: '1.5px solid black', padding: '8px', fontStyle: 'italic', textAlign: 'left', fontSize: '16px', fontWeight: 'bold' }}>
                               {c}
                           </th>
                       ))}
                   </tr>
               </thead>
               <tbody>
                   {serviceTypes.map(service => (
                       <tr key={service}>
                           <td style={{ border: '1.5px solid black', padding: '8px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '16px' }}>
                               {service}
                           </td>
                           {classTypes.map(cType => {
                                const matched = schedules.filter(s => s.serviceType === service && s.className === cType);
                                return (
                                    <td key={cType} style={{ border: '1.5px solid black', padding: '8px', verticalAlign: 'top', fontSize: '16px' }}>
                                        {matched.map(s => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                 <span>{s.assignedPersonName}</span>
                                                 {isAdmin && (
                                                     <div data-html2canvas-ignore="true" style={{ display: 'flex' }}>
                                                        <IconButton size="small" onClick={() => onEdit(s)} sx={{ p: 0.5 }}>
                                                            <EditIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => onDelete(s.id)} sx={{ p: 0.5 }}>
                                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                     </div>
                                                 )}
                                            </div>
                                        ))}
                                        {matched.length === 0 && <span style={{ color: 'transparent' }}>-</span>}
                                    </td>
                                );
                           })}
                       </tr>
                   ))}
               </tbody>
           </table>
           {schedules.filter(s => !serviceTypes.includes(s.serviceType) || !classTypes.includes(s.className)).length > 0 && (
               <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc' }}>
                   <Typography variant="subtitle2" color="error">Uncategorized Schedules:</Typography>
                   {schedules.filter(s => !serviceTypes.includes(s.serviceType) || !classTypes.includes(s.className)).map(s => (
                       <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                           <Typography variant="body2">{s.assignedPersonName} ({s.serviceType || 'Unknown'} - {s.className || 'Unknown'})</Typography>
                           {isAdmin && (
                               <div data-html2canvas-ignore="true">
                                  <IconButton size="small" onClick={() => onEdit(s)}><EditIcon fontSize="inherit" /></IconButton>
                                  <IconButton size="small" color="error" onClick={() => onDelete(s.id)}><DeleteIcon fontSize="inherit" /></IconButton>
                               </div>
                           )}
                       </Box>
                   ))}
               </Box>
           )}
         </Box>
      </Box>
    </Box>
  );
};

const TeacherSchedulePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State declarations
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [currentWeekSunday, setCurrentWeekSunday] = useState(getThisSunday());
  const [teachersList, setTeachersList] = useState([]);
  const [formData, setFormData] = useState({
    className: 'PRE - SCHOOL',
    serviceType: 'FIRST SERVICE',
    assignedPersonName: '',
    assignedWork: '',
    place: 'Kandrika',
    date: getThisSunday().getTime()
  });

  // Computed values
  const isAdmin = currentUser?.role === 'ADMIN' || 
    currentUser?.email === 'gop1@gmail.com' || 
    currentUser?.email === 'premkumartenali@gmail.com';
  
  // Handlers
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };

  useEffect(() => {
    // Fetch teachers for the dropdown
    const fetchTeachers = async () => {
      try {
        const teachersSnapshot = await getDocs(collection(db, 'teachers'));
        const names = teachersSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
        setTeachersList([...new Set(names)].sort());
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();

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
        className: timetable.className || 'PRE - SCHOOL',
        serviceType: timetable.serviceType || 'FIRST SERVICE',
        assignedPersonName: timetable.assignedPersonName || '',
        assignedWork: timetable.assignedWork || '',
        place: timetable.place || 'Kandrika',
        date: dateValue
      });
    } else {
      setEditingTimetable(null);
      setFormData({
        className: 'PRE - SCHOOL',
        serviceType: 'FIRST SERVICE',
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
        notifyError('Missing fields', 'Please fill in all required fields.');
        return;
      }

      const timetableData = {
        className: formData.className,
        serviceType: formData.serviceType || 'FIRST SERVICE',
        assignedPersonName: formData.assignedPersonName,
        assignedWork: formData.assignedWork || '',
        place: formData.place,
        day: 'Sunday',
        date: formData.date,
        createdAt: editingTimetable ? editingTimetable.createdAt : serverTimestamp()
      };

      if (editingTimetable) {
        await updateDoc(doc(db, 'timetables', editingTimetable.id), timetableData);
        notifySuccess('Schedule updated', 'Schedule updated successfully.');
      } else {
        await addDoc(collection(db, 'timetables'), timetableData);

        // Push announcement to the assigned teacher specifically
        try {
           const notifPayload = {
              title: 'New Schedule Assignment',
              message: `You have been scheduled for ${timetableData.className} (${timetableData.serviceType}) at ${timetableData.place} on ${format(new Date(timetableData.date), 'MMMM do, yyyy')}. Task: ${timetableData.assignedWork || 'None assigned'}`,
              audience: timetableData.assignedPersonName,
              isImportant: false,
              type: 'SCHEDULE',
              createdAt: serverTimestamp(),
              sender: currentUser?.name || 'Admin'
           };
           await addDoc(collection(db, 'notifications'), notifPayload);
        } catch (notifErr) {
           console.error('Error sending schedule notification:', notifErr);
        }

        notifySuccess('Schedule saved', 'Schedule saved successfully.');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving timetable:', error);
      notifyError('Save failed', error.message || 'Failed to save schedule.');
    }
  };

  const handleDelete = async (timetableId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'timetables', timetableId));
      notifySuccess('Schedule deleted', 'Deleted successfully.');
    } catch (error) {
      console.error('Error deleting timetable:', error);
      notifyError('Delete failed', error.message || 'Failed to delete schedule.');
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekSunday(subWeeks(currentWeekSunday, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekSunday(addWeeks(currentWeekSunday, 1));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa', pb: 4 }}>
      {/* Glass Header (Sticky) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backgroundImage: 'none',
          borderBottom: `1px solid rgba(0,0,0,0.06)`,
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          pt: 1,
          pb: 1.5,
          px: { xs: 1.5, sm: 2 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1, color: '#1976d2', bgcolor: 'rgba(25, 118, 210, 0.08)' }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: '800', color: '#111', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem' }}>🗓️</span> Schedules
            </Typography>
          </Box>
          
          {isAdmin && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog(null)}
              disableElevation
              sx={{ borderRadius: '12px', fontWeight: 'bold', textTransform: 'none', px: 2, boxShadow: '0 4px 12px rgba(25,118,210,0.2)' }}
            >
              Add New
            </Button>
          )}
        </Box>

        {/* Sleek Week Navigation Pill */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              bgcolor: 'rgba(0,0,0,0.03)',
              borderRadius: '30px',
              p: 0.5,
              width: '100%',
              maxWidth: '350px',
              border: '1px solid rgba(0,0,0,0.04)'
            }}>
            <IconButton onClick={handlePreviousWeek} size="small" sx={{ bgcolor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#333', '&:hover': { bgcolor: '#f5f5f5' } }}>
              <PrevIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: '700', color: '#444', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {format(currentWeekSunday, 'MMM dd, yyyy')}
            </Typography>
            <IconButton onClick={handleNextWeek} size="small" sx={{ bgcolor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#333', '&:hover': { bgcolor: '#f5f5f5' } }}>
              <NextIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, sm: 2 }, mt: 2 }}>
        {(() => {
            const mySchedules = currentSundaySchedules.filter(s => s.assignedPersonName === currentUser?.name);
            if (!isAdmin && mySchedules.length > 0) {
               return (
                   <Alert severity="success" sx={{ mb: 3, borderRadius: 2, border: '1px solid #1b5e20', bgcolor: '#e8f5e9' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>✨ My Schedule for this Sunday:</Typography>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', color: '#1b5e20' }}>
                         {mySchedules.map(s => (
                             <li key={s.id}>
                                <strong>{s.place}</strong>: {s.className} ({s.serviceType}) 
                                {s.assignedWork && ` - ${s.assignedWork}`}
                             </li>
                         ))}
                      </ul>
                   </Alert>
               );
            }
            return null;
        })()}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : currentSundaySchedules.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>No schedules found for this Sunday.</Alert>
        ) : (
          <Box>
            {Object.entries(schedulesByPlace).map(([place, schedules]) => (
              <ScheduleGridView 
                  key={place} 
                  place={place} 
                  schedules={schedules} 
                  dateStr={format(currentWeekSunday, 'dd-MM-yyyy')} 
                  isAdmin={isAdmin}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
              />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="class-name-label">Class Name</InputLabel>
              <Select
                labelId="class-name-label"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                label="Class Name"
              >
                <MenuItem value="PRE - SCHOOL">PRE - SCHOOL</MenuItem>
                <MenuItem value="JUNIORS">JUNIORS</MenuItem>
                <MenuItem value="SENIORS">SENIORS</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="service-type-label">Service Type</InputLabel>
              <Select
                labelId="service-type-label"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                label="Service Type"
              >
                <MenuItem value="FIRST SERVICE">FIRST SERVICE</MenuItem>
                <MenuItem value="SECOND SERVICE">SECOND SERVICE</MenuItem>
                <MenuItem value="THIRD SERVICE">THIRD SERVICE</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="teacher-name-label">Teacher Name</InputLabel>
              <Select
                labelId="teacher-name-label"
                value={formData.assignedPersonName || ''}
                onChange={(e) => setFormData({ ...formData, assignedPersonName: e.target.value })}
                label="Teacher Name"
                displayEmpty
              >
                {/* Fallback for empty state or deleted teachers */}
                {(!formData.assignedPersonName || !teachersList.includes(formData.assignedPersonName)) && (
                   <MenuItem value={formData.assignedPersonName || ''} style={{ display: 'none' }}>
                     {formData.assignedPersonName || ''}
                   </MenuItem>
                )}
                
                {teachersList.map((name, index) => (
                  <MenuItem key={`teacher-${index}`} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Task / Subject"
              value={formData.assignedWork}
              onChange={(e) => setFormData({ ...formData, assignedWork: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
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


