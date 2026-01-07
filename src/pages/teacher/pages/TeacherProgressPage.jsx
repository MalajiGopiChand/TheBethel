import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as ProgressIcon,
  CheckCircle as VerifiedIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const TeacherProgressPage = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0
  });

  useEffect(() => {
    // Real-time listener for teachers
    const teachersQuery = query(collection(db, 'teachers'), orderBy('name'));
    const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
      const teachersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      setTeachers(teachersData);
      
      // Calculate stats
      const total = teachersData.length;
      const verified = teachersData.filter(t => t.isVerified).length;
      setStats({
        total,
        verified,
        pending: total - verified
      });

      setLoading(false);
    }, (error) => {
      console.error('Error fetching teachers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewProgress = (teacherId) => {
    // Navigate to individual progress details page
    navigate(`/admin/teacher-progress/${teacherId}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: 2 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/dashboard')}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Teacher Progress & Reports
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>
      </Paper>

      {/* Stats Cards Section - Added based on imports */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
              <PeopleIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Total Teachers</Typography>
                <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
              <VerifiedIcon sx={{ fontSize: 40, color: '#2e7d32', mr: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Verified</Typography>
                <Typography variant="h4" fontWeight="bold">{stats.verified}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table Section */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : teachers.length === 0 ? (
          <Alert severity="info">No teachers found</Alert>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Join Date</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.uid} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{teacher.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{teacher.phone || '-'}</Typography>
                    </TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.subject || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={teacher.isVerified ? 'Verified' : 'Pending'}
                        color={teacher.isVerified ? 'success' : 'warning'}
                        size="small"
                        variant={teacher.isVerified ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const dateValue = teacher.joinDate || teacher.createdAt;
                        if (!dateValue) return '-';
                        let date;
                        if (typeof dateValue.toDate === 'function') {
                          date = dateValue.toDate();
                        } else if (dateValue instanceof Date) {
                          date = dateValue;
                        } else {
                          date = new Date(dateValue);
                        }
                        return date.toLocaleDateString();
                      })()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Progress Report">
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            startIcon={<ProgressIcon />}
                            onClick={() => handleViewProgress(teacher.uid)}
                        >
                            View
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default TeacherProgressPage;