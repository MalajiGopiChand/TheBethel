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
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const AdminVerifyTeachersPage = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [verifyDialog, setVerifyDialog] = useState({ open: false, teacher: null, verify: true });

  useEffect(() => {
    const teachersQuery = query(collection(db, 'teachers'), orderBy('name'));
    const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
      const teachersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setTeachers(teachersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const pendingTeachers = teachers.filter(t => !t.isVerified);
  const verifiedTeachers = teachers.filter(t => t.isVerified);

  const handleVerify = async (teacher, verify) => {
    try {
      await updateDoc(doc(db, 'teachers', teacher.uid), {
        isVerified: verify
      });
      setVerifyDialog({ open: false, teacher: null, verify: true });
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher: ' + error.message);
    }
  };

  const displayTeachers = selectedTab === 0 ? pendingTeachers : verifiedTeachers;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/dashboard')}>
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
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : displayTeachers.length === 0 ? (
          <Alert severity="info">
            {selectedTab === 0 ? 'No pending teachers to verify.' : 'No verified teachers yet.'}
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
                      icon={teacher.isVerified ? <VerifiedIcon /> : <UnverifiedIcon />}
                      label={teacher.isVerified ? 'Verified' : 'Pending'}
                      color={teacher.isVerified ? 'success' : 'warning'}
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant={teacher.isVerified ? 'outlined' : 'contained'}
                    color={teacher.isVerified ? 'error' : 'success'}
                    startIcon={<VerifyIcon />}
                    onClick={() => setVerifyDialog({ 
                      open: true, 
                      teacher, 
                      verify: !teacher.isVerified 
                    })}
                  >
                    {teacher.isVerified ? 'Unverify' : 'Verify'}
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

