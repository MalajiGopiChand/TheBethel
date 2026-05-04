import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as VerifiedIcon,
  Cancel as UnverifiedIcon,
  VerifiedUser as VerifyIcon
} from '@mui/icons-material';
import {
  collection,
  doc,
  updateDoc,
  query,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { handleBackNavigation } from '../../../utils/navigation';
import { isTeacherVerifiedProfile } from '../../../utils/teacherVerification';

/** Pending review: explicit state or legacy docs without approval. */
function isPendingTeacher(teacher) {
  const state = teacher?.approvalState;
  if (state === 'approved') return false;
  if (state === 'pending' || state === 'rejected') return true;
  return !isTeacherVerifiedProfile(teacher);
}

const AdminVerifyTeachersPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [verifyDialog, setVerifyDialog] = useState({ open: false, teacher: null, verify: true });

  useEffect(() => {
    setLoadError(null);
    const teachersQuery = query(collection(db, 'teachers'));
    const unsubscribe = onSnapshot(
      teachersQuery,
      (snapshot) => {
      const teachersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      // Sort on client side
      teachersData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setTeachers(teachersData);
      setLoading(false);
      setLoadError(null);
      },
      (error) => {
        console.error('AdminVerifyTeachersPage:', error);
        setLoadError(error.message || 'Could not load teachers');
        setTeachers([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isPending = (teacher) => isPendingTeacher(teacher);
  const pendingTeachers = teachers.filter(t => isPending(t));
  const verifiedTeachers = teachers.filter(t => !isPending(t));

  const handleVerify = async (teacher, verify) => {
    try {
      await updateDoc(doc(db, 'teachers', teacher.uid), {
        isVerified: verify,
        isApproved: verify,
        approvalState: verify ? 'approved' : 'pending'
      });
      setVerifyDialog({ open: false, teacher: null, verify: true });
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher: ' + error.message);
    }
  };

  const displayTeachers = selectedTab === 0 ? pendingTeachers : selectedTab === 1 ? verifiedTeachers : teachers;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Verify Teachers
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>

        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label={`Pending (${pendingTeachers.length})`} />
          <Tab label={`Verified (${verifiedTeachers.length})`} />
          <Tab label={`All (${teachers.length})`} />
        </Tabs>
        {loadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {loadError}. If you see permission errors, sign in as admin and deploy Firestore rules.
          </Alert>
        )}
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : displayTeachers.length === 0 ? (
          <Alert severity="info">
            {selectedTab === 0 ? 'No pending teachers to verify.' : selectedTab === 1 ? 'No verified teachers yet.' : 'No teachers found at all.'}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayTeachers.map((teacher) => (
              <Card key={teacher.uid}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="h6">{teacher.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {teacher.email}
                      </Typography>
                      {teacher.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {teacher.phone}
                        </Typography>
                      )}
                      {teacher.subject && (
                        <Chip label={teacher.subject} size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                    <Chip
                      icon={isPending(teacher) ? <UnverifiedIcon /> : <VerifiedIcon />}
                      label={isPending(teacher) ? 'Pending' : 'Verified'}
                      color={isPending(teacher) ? 'warning' : 'success'}
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant={isPending(teacher) ? 'contained' : 'outlined'}
                    color={isPending(teacher) ? 'success' : 'error'}
                    startIcon={<VerifyIcon />}
                    onClick={() => setVerifyDialog({ 
                      open: true, 
                      teacher, 
                      verify: isPending(teacher)
                    })}
                  >
                    {isPending(teacher) ? 'Verify' : 'Unverify'}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Dialog
        open={verifyDialog.open}
        onClose={() => setVerifyDialog({ open: false, teacher: null, verify: true })}
      >
        <DialogTitle>
          {verifyDialog.verify ? 'Verify Teacher' : 'Unverify Teacher'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {verifyDialog.verify
              ? `Are you sure you want to verify ${verifyDialog.teacher?.name}?`
              : `Are you sure you want to unverify ${verifyDialog.teacher?.name}?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialog({ open: false, teacher: null, verify: true })}>
            Cancel
          </Button>
          <Button
            onClick={() => handleVerify(verifyDialog.teacher, verifyDialog.verify)}
            variant="contained"
            color={verifyDialog.verify ? 'success' : 'error'}
          >
            {verifyDialog.verify ? 'Verify' : 'Unverify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVerifyTeachersPage;

