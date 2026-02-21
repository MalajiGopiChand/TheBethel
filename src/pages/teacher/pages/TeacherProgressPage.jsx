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
  Tooltip,
  Avatar,
  Stack,
  Container  // Moved Container import here
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as ProgressIcon,
  CheckCircle as VerifiedIcon,
  People as PeopleIcon,
  PendingActions as PendingIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { format } from 'date-fns';
import { handleBackNavigation } from '../../../utils/navigation';

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

  const handleBack = () => {
    handleBackNavigation(navigate);
  };

  // Helper function to format date consistently
  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    
    try {
      let date;
      if (typeof dateValue?.toDate === 'function') {
        date = dateValue.toDate();
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) return '-';
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: '#f5f5f5'
    }}>
      {/* Header Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 0,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 1400, mx: 'auto', width: '100%' }}>
          <Button 
            startIcon={<BackIcon />} 
            onClick={handleBack}
            variant="text"
            sx={{ minWidth: 100 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Teacher Progress & Reports
          </Typography>
          <Box sx={{ width: 100 }} /> {/* Spacer for alignment */}
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Stats Cards Section - Fixed with 3 cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              bgcolor: '#e3f2fd', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56, mr: 2 }}>
                  <PeopleIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Total Teachers
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="#1976d2">
                    {stats.total}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              bgcolor: '#e8f5e9', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#2e7d32', width: 56, height: 56, mr: 2 }}>
                  <VerifiedIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Verified
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="#2e7d32">
                    {stats.verified}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              bgcolor: '#fff3e0', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#ed6c02', width: 56, height: 56, mr: 2 }}>
                  <PendingIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Pending Verification
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="#ed6c02">
                    {stats.pending}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table Section */}
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" fontWeight="600">
              Teachers List
            </Typography>
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
            </Box>
          ) : teachers.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>No teachers found</Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Teacher</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Join Date</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow 
                      key={teacher.uid} 
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: teacher.isVerified ? '#2e7d32' : '#ed6c02' }}>
                            {getInitials(teacher.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {teacher.name || 'Unnamed Teacher'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {teacher.uid?.slice(-6) || 'N/A'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{teacher.email || '-'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{teacher.phone || '-'}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<SchoolIcon />}
                          label={teacher.subject || 'Not Assigned'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={teacher.isVerified ? 'Verified' : 'Pending'}
                          color={teacher.isVerified ? 'success' : 'warning'}
                          size="medium"
                          variant={teacher.isVerified ? 'filled' : 'outlined'}
                          sx={{ minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(teacher.joinDate || teacher.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Progress Report" arrow>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            startIcon={<ProgressIcon />}
                            onClick={() => handleViewProgress(teacher.uid)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 2
                            }}
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
        </Paper>
      </Container>
    </Box>
  );
};

export default TeacherProgressPage;