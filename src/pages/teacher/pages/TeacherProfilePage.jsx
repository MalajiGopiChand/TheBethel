import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CameraAlt as CameraIcon,
  Save as SaveIcon,
  LogoutRounded as LogoutIcon,
  InstallMobile as InstallIcon
} from '@mui/icons-material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const TeacherProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        const teacherDoc = await getDoc(doc(db, 'teachers', currentUser.uid));
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          setProfileData({
            name: data.name || currentUser.name || '',
            email: data.email || currentUser.email || '',
            phone: data.phone || '',
            profileImageUrl: data.profileImageUrl || ''
          });
          if (data.profileImageUrl) {
            setImagePreview(data.profileImageUrl);
          }
        } else {
          // If teacher doc doesn't exist, use currentUser data
          setProfileData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: '',
            profileImageUrl: ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !currentUser?.uid) return;

    try {
      setUploading(true);
      const imageRef = ref(storage, `teacher_profiles/${currentUser.uid}_${Date.now()}.jpg`);
      await uploadBytes(imageRef, selectedFile);
      const imageUrl = await getDownloadURL(imageRef);
      
      setProfileData(prev => ({ ...prev, profileImageUrl: imageUrl }));
      setImagePreview(imageUrl);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    try {
      setSaving(true);
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        profileImageUrl: profileData.profileImageUrl
      };

      await updateDoc(doc(db, 'teachers', currentUser.uid), updateData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleInstall = () => {
    window.showPWAInstall = true;
    window.dispatchEvent(new Event('pwa-install-request'));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            My Profile
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Install App">
              <IconButton onClick={handleInstall} size="small">
                <InstallIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} size="small" color="error">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Profile updated successfully!
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Picture
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Avatar
                src={imagePreview}
                sx={{ width: 120, height: 120, border: '4px solid #667eea' }}
              >
                {profileData.name?.charAt(0)?.toUpperCase() || 'T'}
              </Avatar>
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageSelect}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CameraIcon />}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Choose Image
                  </Button>
                </label>
                {selectedFile && (
                  <Button
                    variant="contained"
                    onClick={handleImageUpload}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} /> : <SaveIcon />}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  type="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  type="tel"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ mt: 2 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TeacherProfilePage;
