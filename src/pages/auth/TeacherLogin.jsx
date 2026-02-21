import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Link as MuiLink,
  InputAdornment,
  Avatar,
  Fade,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, clearError, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    clearError();
    // Redirect if already logged in - ensure user has role before redirecting
    if (!authLoading && currentUser && currentUser.role) {
      const isAdmin = currentUser.role === UserRole.ADMIN || 
        currentUser.email === 'gop1@gmail.com' || 
        currentUser.email === 'premkumartenali@gmail.com';
      
      if (isAdmin) {
        // Use window.location for PWA compatibility
        if (window.location.pathname !== '/admin/dashboard') {
          navigate('/admin/dashboard', { replace: true });
        }
      } else if (currentUser.role === UserRole.TEACHER) {
        // Use window.location for PWA compatibility
        if (window.location.pathname !== '/teacher/dashboard') {
          navigate('/teacher/dashboard', { replace: true });
        }
      }
    }
  }, [currentUser, authLoading, navigate]);

  // Navigate when user is loaded after login - improved for PWA
  useEffect(() => {
    // Only navigate if we're in loading state (just logged in) and user is loaded
    if (loading && !authLoading && currentUser && currentUser.role) {
      const isAdmin = currentUser.role === UserRole.ADMIN || 
        currentUser.email === 'gop1@gmail.com' || 
        currentUser.email === 'premkumartenali@gmail.com';
      
      if (isAdmin) {
        setLoading(false);
        // Use setTimeout to ensure navigation happens after state update
        setTimeout(() => {
          if (window.location.pathname !== '/admin/dashboard') {
            navigate('/admin/dashboard', { replace: true });
          }
        }, 50);
      } else if (currentUser.role === UserRole.TEACHER) {
        setLoading(false);
        // Use setTimeout to ensure navigation happens after state update
        setTimeout(() => {
          if (window.location.pathname !== '/teacher/dashboard') {
            navigate('/teacher/dashboard', { replace: true });
          }
        }, 50);
      }
    }
  }, [currentUser, authLoading, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await login(email, password, UserRole.TEACHER);
      // Wait for auth state to update and user data to load
      // The useEffect will handle navigation once currentUser is set
    } catch (err) {
      // Error is handled by context
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Soft professional gradient
        py: 4
      }}
    >
      <Container maxWidth="xs">
        <Fade in={true} timeout={800}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4,
              position: 'relative'
            }}
          >
            {/* Header Icon */}
            <Avatar
              sx={{
                m: 1,
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
            >
              
              <SchoolIcon fontSize="large" />
            </Avatar>

            <Typography component="h1" variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              Teacher Login
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The Bethel Church School System
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <MuiLink 
                  component={Link} 
                  to="/" 
                  variant="body2" 
                  sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <ArrowBackIcon sx={{ fontSize: 16, mr: 0.5 }} /> Back
                </MuiLink>

                <MuiLink 
                  component={Link} 
                  to="/auth/teacher/signup" 
                  variant="body2"
                  fontWeight="bold"
                >
                  Create Account
                </MuiLink>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default TeacherLogin;