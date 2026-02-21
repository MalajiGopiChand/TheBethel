import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Container,
  Paper,
  Divider,
  Fade,
  Grow,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Assignment as AssignIcon,
  Event as DateIcon,
  School as ClassIcon,
  Place as PlaceIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { format, isPast, isToday } from 'date-fns';
import { handleBackNavigation } from '../../../utils/navigation';

const HomeworkPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    classType: '',
    place: '',
    dueDate: ''
  });

  // Auto-delete expired homework
  const deleteExpiredHomework = async (homeworksData) => {
    const now = new Date();
    const expiredHomework = homeworksData.filter(hw => {
      if (!hw.dueDate) return false;
      let dueDateObj = null;
      if (typeof hw.dueDate.toDate === 'function') {
        dueDateObj = hw.dueDate.toDate();
      } else if (hw.dueDate instanceof Date) {
        dueDateObj = hw.dueDate;
      }
      if (!dueDateObj) return false;
      // Delete if due date has passed (more than 1 day ago to allow viewing on due date)
      const oneDayAfter = new Date(dueDateObj);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);
      return now > oneDayAfter;
    });

    if (expiredHomework.length > 0) {
      try {
        const batch = writeBatch(db);
        expiredHomework.forEach(hw => {
          batch.delete(doc(db, 'homeworks', hw.id));
        });
        await batch.commit();
        console.log(`Deleted ${expiredHomework.length} expired homework assignments`);
      } catch (error) {
        console.error('Error deleting expired homework:', error);
      }
    }
  };

  useEffect(() => {
    // Show all homework to everyone (not filtered by teacher)
    const homeworksQuery = query(
      collection(db, 'homeworks'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(homeworksQuery, async (snapshot) => {
      const homeworksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Auto-delete expired homework
      await deleteExpiredHomework(homeworksData);
      
      // Filter out expired homework from display (they will be deleted)
      const now = new Date();
      const activeHomeworks = homeworksData.filter(hw => {
        if (!hw.dueDate) return true; // Keep homework without due date
        let dueDateObj = null;
        if (typeof hw.dueDate.toDate === 'function') {
          dueDateObj = hw.dueDate.toDate();
        } else if (hw.dueDate instanceof Date) {
          dueDateObj = hw.dueDate;
        }
        if (!dueDateObj) return true;
        // Show until 1 day after due date
        const oneDayAfter = new Date(dueDateObj);
        oneDayAfter.setDate(oneDayAfter.getDate() + 1);
        return now <= oneDayAfter;
      });
      
      setHomeworks(activeHomeworks);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching homeworks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDialog = (homework) => {
    if (homework) {
      setEditingHomework(homework);
      setFormData({
        title: homework.title || '',
        description: homework.description || '',
        subject: homework.subject || '',
        classType: homework.classType || '',
        place: homework.place || '',
        dueDate: (() => {
          if (!homework.dueDate) return '';
          let date;
          if (typeof homework.dueDate.toDate === 'function') {
            date = homework.dueDate.toDate();
          } else if (homework.dueDate instanceof Date) {
            date = homework.dueDate;
          }
          return date ? format(date, 'yyyy-MM-dd') : '';
        })()
      });
    } else {
      setEditingHomework(null);
      setFormData({
        title: '',
        description: '',
        subject: '',
        classType: '',
        place: '',
        dueDate: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHomework(null);
  };

  const handleSave = async () => {
    try {
      const homeworkData = {
        ...formData,
        teacherId: currentUser?.uid,
        teacherName: currentUser?.name,
        createdAt: editingHomework ? undefined : serverTimestamp(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null
      };

      if (editingHomework) {
        await updateDoc(doc(db, 'homeworks', editingHomework.id), homeworkData);
      } else {
        await addDoc(collection(db, 'homeworks'), homeworkData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving homework:', error);
      alert('Failed to save homework: ' + error.message);
    }
  };

  const handleDelete = async (homework) => {
    if (!window.confirm('Delete this homework assignment?')) return;
    try {
      await deleteDoc(doc(db, 'homeworks', homework.id));
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      
      {/* 1. Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="bold">Homework</Typography>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(null)}
                sx={{ borderRadius: 2 }}
            >
                Assign New
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* 2. Content Grid */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : homeworks.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8} sx={{ opacity: 0.6 }}>
            <AssignIcon sx={{ fontSize: 60, mb: 2, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">No assignments yet</Typography>
            <Typography variant="body2" color="text.secondary">Create your first homework assignment above.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {homeworks.map((homework, index) => {
              // Date logic for styling
              let dueDateObj = null;
              if (homework.dueDate) {
                  if (typeof homework.dueDate.toDate === 'function') dueDateObj = homework.dueDate.toDate();
                  else if (homework.dueDate instanceof Date) dueDateObj = homework.dueDate;
              }
              const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);

              return (
                <Grid item xs={12} md={6} lg={4} key={homework.id}>
                  <Grow in={true} timeout={index * 100 + 300}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        height: '100%',
                        borderRadius: 3, 
                        border: '1px solid',
                        borderColor: isOverdue ? 'error.light' : 'divider',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                      }}
                    >
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        
                        {/* Title & Actions */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                                {homework.title}
                            </Typography>
                                {homework.teacherName && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        Assigned by: {homework.teacherName}
                                    </Typography>
                                )}
                            </Box>
                            <Box>
                                {/* Only show edit/delete if current user is the one who posted it */}
                                {homework.teacherId === currentUser?.uid && (
                                    <>
                                <IconButton size="small" onClick={() => handleOpenDialog(homework)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete(homework)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Metadata Tags */}
                        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                            {homework.subject && (
                                <Chip label={homework.subject} size="small" sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 'bold' }} />
                            )}
                            {homework.classType && (
                                <Chip icon={<ClassIcon style={{fontSize: 14}}/>} label={homework.classType} size="small" variant="outlined" />
                            )}
                            {homework.place && (
                                <Chip icon={<PlaceIcon style={{fontSize: 14}}/>} label={homework.place} size="small" variant="outlined" />
                            )}
                        </Box>

                        {/* Description */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, whiteSpace: 'pre-line' }}>
                            {homework.description}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        {/* Footer / Due Date */}
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            {dueDateObj ? (
                                <Box display="flex" alignItems="center" gap={0.5} color={isOverdue ? 'error.main' : 'text.secondary'}>
                                    {isOverdue ? <WarningIcon fontSize="small" /> : <DateIcon fontSize="small" />}
                                    <Typography variant="caption" fontWeight="bold">
                                        Due: {format(dueDateObj, 'MMM dd, yyyy')}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography variant="caption" color="text.disabled">No Due Date</Typography>
                            )}
                        </Box>

                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* 3. Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
            {editingHomework ? 'Edit Assignment' : 'New Assignment'}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Mathematics, English"
            />
            
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        select
                        label="Class"
                        fullWidth
                        value={formData.classType}
                        onChange={(e) => setFormData({ ...formData, classType: e.target.value })}
                    >
                        <MenuItem value="">All Classes</MenuItem>
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Primary">Primary</MenuItem>
                        <MenuItem value="Secondary">Secondary</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        select
                        label="Location"
                        fullWidth
                        value={formData.place}
                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                    >
                        <MenuItem value="">All Locations</MenuItem>
                        <MenuItem value="Kandrika">Kandrika</MenuItem>
                        <MenuItem value="Krishna Lanka">Krishna Lanka</MenuItem>
                        <MenuItem value="Gandhiji Conly">Gandhiji Conly</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                </Grid>
            </Grid>

            <TextField
              label="Description / Instructions"
              fullWidth
              multiline
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            
            <TextField
              label="Due Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!formData.title || !formData.description}
            sx={{ borderRadius: 2 }}
          >
            {editingHomework ? 'Update Assignment' : 'Post Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomeworkPage;