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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  TextField,
  IconButton,
  Container,
  Fade,
  Grow,
  Avatar,
  Divider,
  useTheme
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Groups as TotalIcon,
  Timeline as AverageIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { handleBackNavigation } from '../../../utils/navigation';

const AttendanceSummaryPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };
  const theme = useTheme();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  useEffect(() => {
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      let studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by class
      if (selectedClass !== 'All') {
        studentsData = studentsData.filter(s => s.classType === selectedClass);
      }

      // Filter by place
      if (selectedPlace !== 'All') {
        studentsData = studentsData.filter(s => {
          const loc = s.location || s.place || '';
          return selectedPlace === 'Other' 
            ? !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(loc)
            : loc === selectedPlace;
        });
      }

      // Calculate stats
      studentsData = studentsData.map(student => {
        const attendance = student.attendance || [];
        const absentDates = student.absentDates || [];
        
        const attendanceInRange = attendance.filter(date => date >= dateRange.start && date <= dateRange.end);
        const absentInRange = absentDates.filter(date => date >= dateRange.start && date <= dateRange.end);

        const totalDays = attendanceInRange.length + absentInRange.length;
        const attendancePercentage = totalDays > 0
          ? Math.round((attendanceInRange.length / totalDays) * 100)
          : 0;

        return {
          ...student,
          attendanceInRange: attendanceInRange.length,
          absentInRange: absentInRange.length,
          totalDays,
          attendancePercentage
        };
      });

      setStudents(studentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedPlace, dateRange]);

  const overallStats = {
    total: students.length,
    present: students.reduce((sum, s) => sum + s.attendanceInRange, 0),
    absent: students.reduce((sum, s) => sum + s.absentInRange, 0),
    averagePercentage: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length)
      : 0
  };

  // Helper for Stats Cards
  const StatCard = ({ title, value, icon, color, delay }) => (
    <Grow in={!loading} timeout={delay}>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          borderRadius: 3, 
          border: '1px solid',
          borderColor: 'divider',
          background: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', top: -10, right: -10, p: 3, bgcolor: `${color}15`, borderRadius: '50%' }} />
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>
              {value}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          bgcolor: 'rgba(255,255,255,0.9)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.1)' 
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleBack} sx={{ mr: 1, bgcolor: 'grey.100' }}>
                <BackIcon />
                </IconButton>
                <Typography variant="h6" fontWeight="800" color="text.primary">
                Attendance Reports
                </Typography>
            </Box>
            
            {/* Quick Actions / Date Display */}
            <Chip 
                label={`${format(new Date(dateRange.start), 'MMM d')} - ${format(new Date(dateRange.end), 'MMM d')}`} 
                variant="outlined" 
                sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        
        {/* 2. Filters Section */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <FilterIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">FILTERS</Typography>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Class</InputLabel>
                        <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                            {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Place</InputLabel>
                        <Select value={selectedPlace} label="Place" onChange={(e) => setSelectedPlace(e.target.value)}>
                            {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField fullWidth label="Start Date" type="date" size="small" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField fullWidth label="End Date" type="date" size="small" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
            </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress thickness={4} />
          </Box>
        ) : (
          <>
            {/* 3. Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Total Students" value={overallStats.total} icon={<TotalIcon />} color={theme.palette.primary.main} delay={200} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Total Present" value={overallStats.present} icon={<PresentIcon />} color={theme.palette.success.main} delay={400} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Total Absent" value={overallStats.absent} icon={<AbsentIcon />} color={theme.palette.error.main} delay={600} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Avg. Attendance" value={`${overallStats.averagePercentage}%`} icon={<AverageIcon />} color={theme.palette.warning.main} delay={800} />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* 4. Chart Section */}
                <Grid item xs={12} md={4}>
                    <Fade in={!loading} timeout={1000}>
                        <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e0e0e0', p: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" textAlign="center" sx={{ mt: 2, mb: 1 }}>
                                Attendance Distribution
                            </Typography>
                            {overallStats.total > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Present', value: overallStats.present, color: theme.palette.success.main },
                                                { name: 'Absent', value: overallStats.absent, color: theme.palette.error.main }
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[{ color: theme.palette.success.main }, { color: theme.palette.error.main }].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box height={200} display="flex" alignItems="center" justifyContent="center">
                                    <Typography color="text.secondary">No data available</Typography>
                                </Box>
                            )}
                        </Card>
                    </Fade>
                </Grid>

                {/* 5. Detailed Table */}
                <Grid item xs={12} md={8}>
                    <Fade in={!loading} timeout={1200}>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', maxHeight: 400 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Class</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Present</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Absent</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Rate</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                No records found for this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student) => (
                                            <TableRow key={student.id} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">{student.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{student.studentId}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={student.classType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" color="success.main" fontWeight="bold">{student.attendanceInRange}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" color="error.main" fontWeight="bold">{student.absentInRange}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={`${student.attendancePercentage}%`} 
                                                        size="small" 
                                                        color={student.attendancePercentage >= 75 ? 'success' : student.attendancePercentage >= 50 ? 'warning' : 'error'}
                                                        sx={{ fontWeight: 'bold', minWidth: 50 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Fade>
                </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default AttendanceSummaryPage;