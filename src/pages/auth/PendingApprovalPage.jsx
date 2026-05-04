import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  Avatar,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  HourglassEmpty as HourglassIcon,
  ExitToApp as LogoutIcon,
  CheckCircle as ApprovedIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserRole } from '../../types';
import { isTeacherPendingAccess, isTeacherVerifiedProfile } from '../../utils/teacherVerification';

const PendingApprovalPage = () => {
  const { currentUser, logout, firebaseUser, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isApproved, setIsApproved] = useState(false);
  const approvalHandledRef = useRef(false);

  useEffect(() => {
    if (!currentUser || !firebaseUser) {
      navigate('/auth/teacher/login');
      return;
    }

    if (currentUser.role !== UserRole.TEACHER) {
      navigate('/');
      return;
    }

    // If they are already verified, redirect them
    if (!isTeacherPendingAccess(currentUser)) {
      navigate('/teacher/dashboard');
      return;
    }

    // Set up a listener for real-time approval
    const unsubscribe = onSnapshot(doc(db, 'teachers', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (isTeacherVerifiedProfile(data) && !approvalHandledRef.current) {
          approvalHandledRef.current = true;
          setIsApproved(true);
          refreshUserProfile();
          // Small delay so they can see the success animation before redirecting
          setTimeout(() => {
            navigate('/teacher/dashboard');
          }, 2000);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, firebaseUser, navigate, refreshUserProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Paper
            elevation={6}
            sx={{
              p: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            <Avatar
              sx={{
                m: 2,
                bgcolor: isApproved ? 'success.main' : 'warning.main',
                width: 80,
                height: 80,
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
            >
              {isApproved ? <ApprovedIcon sx={{ fontSize: 40 }} /> : <HourglassIcon sx={{ fontSize: 40 }} />}
            </Avatar>

            <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              {isApproved ? 'Account Approved!' : 'Pending Approval'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '400px' }}>
              {isApproved 
                ? 'Your account has been verified by an Admin. Redirecting you to your dashboard...'
                : 'Your account has been created successfully, but an Admin needs to verify it before you can access the dashboard. Please wait.'
              }
            </Typography>

            {!isApproved && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <CircularProgress size={24} color="warning" />
                <Typography variant="body2" color="warning.main" fontWeight="bold">
                  Checking status...
                </Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              color="inherit"
              size="large"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Log Out
            </Button>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default PendingApprovalPage;
