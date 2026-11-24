import AuthLayout, { AuthPasswordField } from '../../components/AuthLayout';
import React, { useState } from 'react';
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
  Grid
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon,
  HowToReg as RegIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const TeacherSignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { signUp, error, clearError } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    clearError();
  }, []);

  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setValidationError('');
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please check both password fields.');
      return;
    }
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 10) {
      setValidationError('Enter your name and a phone number with at least 10 digits.');
      return;
    }

    setLoading(true);
    clearError();
    try {
      await signUp(name, email, password, phone, UserRole.TEACHER);
      // Let App.jsx handle the routing based on currentUser.isVerified
    } catch (err) {
      // Error is handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout role="teacher" signup>
      {(validationError || error) && (
              <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }} onClose={() => { setValidationError(''); clearError(); }}>
                {validationError || error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: 2 }} onClose={() => setSuccessMessage('')}>
                {successMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Email Address"
                autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <AuthPasswordField
                    required
                    fullWidth
                    label="Password"
                    newPassword
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    helperText="At least 6 characters"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <AuthPasswordField
                    required
                    fullWidth
                    label="Confirm Password"
                    newPassword
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={password !== confirmPassword && confirmPassword.length > 0}
                    helperText={
                      password !== confirmPassword && confirmPassword.length > 0
                        ? "Passwords don't match"
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

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
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)', // Matching secondary color shadow
                  bgcolor: 'secondary.main',
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
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

                <Box>
                  <Typography variant="body2" component="span" color="text.secondary">
                    Already registered?{' '}
                  </Typography>
                  <MuiLink
                    component={Link}
                    to="/auth/teacher/login"
                    variant="body2"
                    fontWeight="bold"
                    color="secondary.main"
                  >
                    Sign In
                  </MuiLink>
                </Box>
              </Box>
            </Box>
    </AuthLayout>
  );
};

export default TeacherSignUp;
