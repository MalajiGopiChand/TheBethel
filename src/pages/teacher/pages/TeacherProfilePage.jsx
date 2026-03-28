import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
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
  Tooltip,
  useTheme
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
import { handleBackNavigation } from '../../../utils/navigation';

const TeacherProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };
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
      {/* Glass Header (Sticky) */}
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
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '900', color: '#000', letterSpacing: '-0.03em', fontSize: { xs: '1.25rem' } }}>
              My Profile
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Install App">
                <IconButton onClick={handleInstall} sx={{ color: 'primary.main', bgcolor: 'rgba(0,0,0,0.04)' }}>
                  <InstallIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} sx={{ color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)' }}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Profile updated successfully!
          </Alert>
        )}

        <Card sx={{ mb: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="800" color="text.secondary" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }} gutterBottom>
              Profile Picture
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 3, mb: 1 }}>
              <Avatar
                src={imagePreview}
                sx={{ 
                  width: 140, 
                  height: 140, 
                  border: '4px solid white', 
                  boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                  bgcolor: theme.palette.primary.main,
                  fontSize: '3rem'
                }}
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
                    variant={selectedFile ? "outlined" : "contained"}
                    color={selectedFile ? "secondary" : "primary"}
                    component="span"
                    startIcon={<CameraIcon />}
                    sx={{ mt: 1, borderRadius: 999, px: 3, fontWeight: 'bold' }}
                  >
                    {selectedFile ? 'Change Selection' : 'Choose New Photo'}
                  </Button>
                </label>
                {selectedFile && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleImageUpload}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    sx={{ mt: 1, ml: 1, borderRadius: 999, px: 3, fontWeight: 'bold', boxShadow: '0 4px 14px rgba(46,125,50,0.4)' }}
                  >
                    {uploading ? 'Uploading...' : 'Confirm Upload'}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" fontWeight="800" color="text.secondary" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 3 }}>
              Personal Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  type="email"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  type="tel"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 999, 
                    fontWeight: '900', 
                    fontSize: '1.05rem',
                    boxShadow: '0 8px 20px rgba(59,130,246,0.3)',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(59,130,246,0.4)' }
                  }}
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
