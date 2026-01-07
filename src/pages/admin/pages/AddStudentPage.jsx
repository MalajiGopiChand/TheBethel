import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const AddStudentPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    fatherName: '',
    motherName: '',
    classType: 'Beginner',
    location: 'Kandrika',
    customPlace: '',
    mobileNumber: ''
  });
  const [showCustomPlace, setShowCustomPlace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const classOptions = ['Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId.trim() || !formData.name.trim()) {
      setError('Please fill in required fields (Student ID and Name)');
      return;
    }

    // Check if student ID already exists
    try {
      setLoading(true);
      setError('');
      
      const existingQuery = query(
        collection(db, 'students'),
        where('studentId', '==', formData.studentId.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        setError('Student ID already exists. Please use a different ID.');
        setLoading(false);
        return;
      }

      const finalPlace = formData.location === 'Other' 
        ? formData.customPlace.trim() 
        : formData.location;

      await addDoc(collection(db, 'students'), {
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim() || '',
        motherName: formData.motherName.trim() || '',
        classType: formData.classType,
        place: finalPlace,
        location: finalPlace,
        mobileNumber: formData.mobileNumber.trim() || '',
        attendance: [],
        absentDates: [],
        dollarPoints: 0,
        currentStreak: 0,
        createdAt: Date.now()
      });

      alert('Student added successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Failed to add student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/dashboard')}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Add New Student
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxWidth: 600, mx: 'auto', width: '100%' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Student ID (Roll Number) *"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
              helperText="Unique ID for parent login"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Student Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Father's Name"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Mother's Name"
              value={formData.motherName}
              onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Mobile Number"
              value={formData.mobileNumber}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                  setFormData({ ...formData, mobileNumber: val });
                }
              }}
              inputProps={{ maxLength: 10 }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Class *</InputLabel>
              <Select
                value={formData.classType}
                onChange={(e) => setFormData({ ...formData, classType: e.target.value })}
                label="Class *"
                required
              >
                {classOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Location *</InputLabel>
              <Select
                value={formData.location}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, location: val });
                  setShowCustomPlace(val === 'Other');
                }}
                label="Location *"
                required
              >
                {placeOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {showCustomPlace && (
              <TextField
                fullWidth
                label="Custom Place Name"
                value={formData.customPlace}
                onChange={(e) => setFormData({ ...formData, customPlace: e.target.value })}
                required={showCustomPlace}
                sx={{ mb: 2 }}
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/admin/dashboard')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Student'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default AddStudentPage;

