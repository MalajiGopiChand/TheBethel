import AuthLayout, { AuthPasswordField } from '../../components/AuthLayout';
import SchoolLoader from '../../components/SchoolLoader';
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
  Fade
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  FamilyRestroom as FamilyIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const ParentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, clearError, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    // Redirect if already logged in
    if (!authLoading && currentUser && currentUser.role === UserRole.PARENT) {
      navigate('/parent/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  // Navigate when user is loaded after login
  useEffect(() => {
    if (loading && !authLoading && currentUser && currentUser.role === UserRole.PARENT) {
      navigate('/parent/dashboard', { replace: true });
      setLoading(false);
    }
  }, [currentUser, authLoading, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    clearError();

    try {
      await login(email, password, UserRole.PARENT);
      // Don't navigate here - let useEffect handle it when currentUser is set
      // Keep loading true until user data is loaded
    } catch (err) {
      // Error is handled by context
      setLoading(false);
    }
  };

  return (
    <AuthLayout role="parent">
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
                type="email"
                name="email"
                autoComplete="email"
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
              <AuthPasswordField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"

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
                color="secondary" // Matching the Parent theme
                size="large"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                  }
                }}
                disabled={loading}
              >
                {loading ? <SchoolLoader inline /> : 'Sign In'}
              </Button>

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <MuiLink
                  component={Link}
                  to="/"
                  variant="body2"
                  sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'secondary.main' } }}
                >
                  <ArrowBackIcon sx={{ fontSize: 16, mr: 0.5 }} /> Back
                </MuiLink>

                <MuiLink
                  component={Link}
                  to="/auth/parent/signup"
                  variant="body2"
                  fontWeight="bold"
                  color="secondary.main"
                >
                  Create Account
                </MuiLink>
              </Box>
            </Box>
    </AuthLayout>
  );
};

export default ParentLogin;
