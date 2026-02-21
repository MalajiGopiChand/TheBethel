import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Update as UpdateIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const AdminSendNotificationPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // --- States ---
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'All',
    isImportant: false
  });
  
  // State for Editing
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // --- 1. Load History (Real-time) ---
  useEffect(() => {
    // FIX: Changed 'date' to 'createdAt' to match Parent Dashboard logic
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. Handle Form Submit (Create OR Update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setAlertMsg({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title,
        message: formData.message,
        audience: formData.audience,
        isImportant: formData.isImportant,
        // FIX: Using 'createdAt' to ensure consistency across the app
        createdAt: serverTimestamp(), 
        sender: currentUser?.name || 'Admin'
      };

      if (editingId) {
        // --- UPDATE EXISTING ---
        await updateDoc(doc(db, 'notifications', editingId), payload);
        setAlertMsg({ type: 'success', text: 'Notification updated successfully!' });
      } else {
        // --- CREATE NEW ---
        await addDoc(collection(db, 'notifications'), payload);
        setAlertMsg({ type: 'success', text: 'Notification broadcasted successfully!' });
      }

      // Reset Form
      setFormData({ title: '', message: '', audience: 'All', isImportant: false });
      setEditingId(null);
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlertMsg({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error:', error);
      setAlertMsg({ type: 'error', text: 'Operation failed: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  // --- 3. Handle Edit Click ---
  const handleEdit = (notification) => {
    setEditingId(notification.id);
    setFormData({
      title: notification.title,
      message: notification.message,
      audience: notification.audience || 'All',
      isImportant: notification.isImportant || false
    });
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 4. Handle Cancel Edit ---
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', message: '', audience: 'All', isImportant: false });
  };

  // --- 5. Handle Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setAlertMsg({ type: 'info', text: 'Notification deleted.' });
      setTimeout(() => setAlertMsg({ type: '', text: '' }), 3000);
      
      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (error) {
      alert("Error deleting: " + error.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      
      {/* --- Top Bar --- */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 1000, mx: 'auto' }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Dashboard
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CampaignIcon color="primary" /> Notification Center
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 1000, mx: 'auto', width: '100%', p: 2 }}>
        
        {/* --- Alert Messages --- */}
        {alertMsg.text && (
          <Alert severity={alertMsg.type} sx={{ mb: 2 }}>
            {alertMsg.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          
          {/* --- LEFT COLUMN: Form (Create/Edit) --- */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }} elevation={3}>
              <Typography variant="h6" gutterBottom sx={{ color: editingId ? 'warning.main' : 'primary.main', fontWeight: 'bold' }}>
                {editingId ? 'Edit Message' : 'Compose New Message'}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  size="small"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Message Content"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  multiline
                  rows={6}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    label="Target Audience"
                  >
                    <MenuItem value="All">All Users</MenuItem>
                    <MenuItem value="Teachers">Teachers Only</MenuItem>
                    <MenuItem value="Parents">Parents Only</MenuItem>
                    <MenuItem value="All Students">All Students</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isImportant}
                      onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                      color="error"
                    />
                  }
                  label="Mark as Important (Urgent)"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {editingId && (
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      onClick={handleCancelEdit}
                      fullWidth
                      startIcon={<CancelIcon />}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color={editingId ? "warning" : "primary"}
                    startIcon={editingId ? <UpdateIcon /> : <SendIcon />}
                    disabled={saving}
                    fullWidth
                  >
                    {saving ? 'Processing...' : (editingId ? 'Update Message' : 'Broadcast')}
                  </Button>
                </Box>
              </form>
            </Paper>
          </Grid>

          {/* --- RIGHT COLUMN: History List --- */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HistoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Sent History
              </Typography>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
            ) : notifications.length === 0 ? (
              <Alert severity="info">No notifications sent yet.</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {notifications.map((note) => (
                  <Card 
                    key={note.id} 
                    elevation={editingId === note.id ? 8 : 1}
                    sx={{ 
                      borderLeft: note.isImportant ? '5px solid #d32f2f' : '5px solid #1976d2',
                      border: editingId === note.id ? '2px solid #ed6c02' : 'none',
                      transition: '0.3s'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {note.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                            <Chip label={note.audience} size="small" variant="outlined" />
                            {note.isImportant && <Chip label="Important" size="small" color="error" />}
                          </Box>
                        </Box>
                        <Box>
                          <IconButton size="small" color="primary" onClick={() => handleEdit(note)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(note.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {note.message}
                      </Typography>
                      
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.disabled', textAlign: 'right' }}>
                        {/* FIX: Handling createdAt field properly */}
                        {note.createdAt?.seconds 
                          ? new Date(note.createdAt.seconds * 1000).toLocaleString() 
                          : 'Just now'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminSendNotificationPage;