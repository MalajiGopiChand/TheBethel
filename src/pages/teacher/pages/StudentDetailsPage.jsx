import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Card, CardContent, CircularProgress,
  TextField, Grid, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, InputAdornment, IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  AttachMoney as DollarIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  doc, onSnapshot, collection, query, where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const StudentDetailsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Logic: Get ID from URL, or null if empty
  const studentId = searchParams.get('id');
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  // 1. Helper: Calculate Points
  const calculateDollarPoints = (studentData) => {
    const rewardsList = studentData.rewards || [];
    let calculatedPoints = 0;
    for (const reward of rewardsList) {
      const points = reward.dollars;
      if (typeof points === 'number') {
        calculatedPoints += points;
      } else if (typeof points === 'string') {
        calculatedPoints += parseInt(points) || 0;
      }
    }
    return calculatedPoints > 0 ? calculatedPoints : (studentData.dollarPoints || 0);
  };

  // 2. Fetch Data Effect
  useEffect(() => {
    if (!studentId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    let unsubscribe;

    // A. Check if ID looks like a Document ID (alphanumeric mixed) or a custom StudentID (usually numbers)
    // We try querying by custom 'studentId' field first as that is what users usually type
    const q = query(collection(db, 'students'), where('studentId', '==', studentId));
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            // Found by custom ID
            const rawData = snapshot.docs[0].data();
            loadStudentData({ id: snapshot.docs[0].id, ...rawData });
        } else {
            // B. Not found by custom ID, try Document ID directly
             const docRef = doc(db, 'students', studentId);
             onSnapshot(docRef, (docSnap) => {
                 if (docSnap.exists()) {
                     loadStudentData({ id: docSnap.id, ...docSnap.data() });
                 } else {
                     setStudent(null); // Truly not found
                     setLoading(false);
                 }
             });
        }
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [studentId]);

  const loadStudentData = (data) => {
     const calculatedPoints = calculateDollarPoints(data);
     const completeData = { ...data, dollarPoints: calculatedPoints };
     setStudent(completeData);
     
     // Process Rewards
     const rewardsList = completeData.rewards || [];
     rewardsList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
     setRewards(rewardsList);
     setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
        setSearchParams({ id: searchInput.trim() });
    }
  };

  // --- RENDER HELPERS ---
  
  const renderSearchBar = () => (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 60, color: '#4facfe', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight="bold">Find Student</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter a Student ID to view their full profile and history.
        </Typography>
        <form onSubmit={handleSearch}>
            <TextField 
                fullWidth 
                label="Enter Student ID" 
                variant="outlined"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleSearch} edge="end">
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2, bgcolor: '#4facfe', height: 50 }}
            >
                Search Profile
            </Button>
        </form>
    </Paper>
  );

  // --- MAIN RENDER ---

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // State: No ID provided yet -> Show Search
  if (!studentId) {
      return (
        <Box sx={{ p: 2 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/teacher/students')}>Back</Button>
            {renderSearchBar()}
        </Box>
      );
  }

  // State: ID provided but not found
  if (studentId && !student) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => setSearchParams({})}>Back to Search</Button>
        <Alert severity="error" sx={{ mt: 2 }}>Student with ID "{studentId}" not found.</Alert>
      </Box>
    );
  }

  // State: Student Found (Your original UI)
  const attendanceCount = (student.attendance || []).length;
  const absentCount = (student.absentDates || []).length;
  const totalDays = attendanceCount + absentCount;
  const attendancePercentage = totalDays > 0 ? Math.round((attendanceCount / totalDays) * 100) : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: 2 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/teacher/students')}>
          Back
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
          Student Profile
        </Typography>
        <Button startIcon={<SearchIcon />} onClick={() => setSearchParams({})}>
            Search
        </Button>
      </Paper>

      {/* Content Grid */}
      <Grid container spacing={2}>
        
        {/* Left Col: Personal Info */}
        <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} /> Personal Information
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body1" fontWeight="bold">{student.name}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">ID</Typography><Typography variant="body1">{student.studentId}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Class</Typography><br /><Chip label={student.classType} size="small" color="primary" variant="outlined" /></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{student.location || student.place || '-'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Father</Typography><Typography variant="body1">{student.fatherName || '-'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Mother</Typography><Typography variant="body1">{student.motherName || '-'}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
        </Grid>

        {/* Right Col: Performance */}
        <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <DollarIcon sx={{ mr: 1, color: 'success.main' }} /> Performance
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                     <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0fdf4', textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Dollar Points</Typography>
                        <Typography variant="h4" color="success.main" fontWeight="bold">${student.dollarPoints}</Typography>
                     </Paper>
                  </Grid>
                  <Grid item xs={6}>
                     <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff7ed', textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Streak</Typography>
                        <Typography variant="h4" color="warning.main" fontWeight="bold">{student.currentStreak}🔥</Typography>
                     </Paper>
                  </Grid>
                  <Grid item xs={12}>
                     <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Grid container>
                            <Grid item xs={6}>
                                <Typography variant="caption">Attendance</Typography>
                                <Typography variant="h6">{attendanceCount} Days</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption">Rate</Typography>
                                <Typography variant="h6">{attendancePercentage}%</Typography>
                            </Grid>
                        </Grid>
                     </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
        </Grid>

        {/* Bottom Col: Rewards History */}
        <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'action.active' }} /> Reward History
                </Typography>
                {rewards.length === 0 ? (
                  <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center', py: 4 }}>No rewards recorded yet</Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Teacher</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rewards.map((reward, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{reward.date || 'N/A'}</TableCell>
                            <TableCell><Typography fontWeight="bold" color="success.main">+${reward.dollars}</Typography></TableCell>
                            <TableCell>{reward.reason || '-'}</TableCell>
                            <TableCell>{reward.teacher || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default StudentDetailsPage;