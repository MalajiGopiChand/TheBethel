import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
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
  useTheme,
  Stack
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const classOptions = ['All', 'Beginner', 'Primary', 'Secondary'];
  const placeOptions = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  const getRecordForDate = (student, dateStr) => {
    const byDate = student.attendanceByDate || {};
    const record = byDate?.[dateStr];
    if (record?.status === 'present' || record?.status === 'absent') {
      return { status: record.status, teacherName: record.teacherName || '' };
    }
    const attendance = student.attendance || [];
    const absentDates = student.absentDates || [];

    // Legacy format support: "yyyy-MM-dd::Teacher Name"
    const presentLegacy = attendance.find((v) => typeof v === 'string' && v.startsWith(`${dateStr}::`));
    if (presentLegacy) {
      return { status: 'present', teacherName: presentLegacy.split('::').slice(1).join('::') || '' };
    }
    const absentLegacy = absentDates.find((v) => typeof v === 'string' && v.startsWith(`${dateStr}::`));
    if (absentLegacy) {
      return { status: 'absent', teacherName: absentLegacy.split('::').slice(1).join('::') || '' };
    }

    // Older legacy: date stored without teacher name
    if (attendance.includes(dateStr)) return { status: 'present', teacherName: '' };
    if (absentDates.includes(dateStr)) return { status: 'absent', teacherName: '' };
    return { status: null, teacherName: '' };
  };

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

      studentsData = studentsData.map((student) => {
        const rec = getRecordForDate(student, selectedDate);
        return {
          ...student,
          dayStatus: rec.status,
          dayTeacherName: rec.teacherName
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      setStudents(studentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedPlace, selectedDate]);

  const overallStats = {
    total: students.length,
    present: students.filter((s) => s.dayStatus === 'present').length,
    absent: students.filter((s) => s.dayStatus === 'absent').length,
    unmarked: students.filter((s) => !s.dayStatus).length
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
      
      {/* 1. Glass Header (Sticky) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backgroundImage: 'none',
          borderBottom: `1px solid rgba(0,0,0,0.08)`,
          backdropFilter: 'blur(22px)',
          zIndex: 1000
        }}
      >
        <Toolbar sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
           <IconButton onClick={handleBack} sx={{ mr: 1, color: '#000', bgcolor: 'rgba(0,0,0,0.04)' }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '900', color: '#000', letterSpacing: '-0.03em', fontSize: { xs: '1.2rem', sm: '1.25rem' } }}>
              Summary
            </Typography>
            <Chip 
                label={format(new Date(selectedDate), 'MMM d, yyyy')} 
                size="small"
                variant="outlined" 
                sx={{ fontWeight: 'bold' }}
            />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ flex: 1, pt: 3, pb: 12 }}>
        
        {/* Scrollable Filters */}
        <Box className="hide-scrollbar" sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            sx={{ minWidth: 150, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}>
            <InputLabel>Class</InputLabel>
            <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
              {classOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0, bgcolor: 'white', borderRadius: 1 }}>
            <InputLabel>Location</InputLabel>
            <Select value={selectedPlace} label="Location" onChange={(e) => setSelectedPlace(e.target.value)}>
              {placeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

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
                <StatCard title="Present (Selected Day)" value={overallStats.present} icon={<PresentIcon />} color={theme.palette.success.main} delay={400} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Absent (Selected Day)" value={overallStats.absent} icon={<AbsentIcon />} color={theme.palette.error.main} delay={600} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="Unmarked (Selected Day)" value={overallStats.unmarked} icon={<AverageIcon />} color={theme.palette.warning.main} delay={800} />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* 4. Chart Section */}
                <Grid item xs={12} md={4}>
                    <Fade in={!loading} timeout={1000}>
                        <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e0e0e0', p: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" textAlign="center" sx={{ mt: 2, mb: 1 }}>
                                Distribution (Selected Day)
                            </Typography>
                            {overallStats.total > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Present', value: overallStats.present, color: theme.palette.success.main },
                                                { name: 'Absent', value: overallStats.absent, color: theme.palette.error.main },
                                                { name: 'Unmarked', value: overallStats.unmarked, color: theme.palette.grey[500] }
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[
                                              { color: theme.palette.success.main },
                                              { color: theme.palette.error.main },
                                              { color: theme.palette.grey[500] }
                                            ].map((entry, index) => (
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
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>Teacher</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
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
                                                    <Chip
                                                      label={
                                                        student.dayStatus === 'present'
                                                          ? 'PRESENT'
                                                          : student.dayStatus === 'absent'
                                                          ? 'ABSENT'
                                                          : 'UNMARKED'
                                                      }
                                                      size="small"
                                                      color={
                                                        student.dayStatus === 'present'
                                                          ? 'success'
                                                          : student.dayStatus === 'absent'
                                                          ? 'error'
                                                          : 'default'
                                                      }
                                                      variant={student.dayStatus ? 'filled' : 'outlined'}
                                                      sx={{ fontWeight: 'bold', minWidth: 90 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                  <Typography variant="body2" color="text.secondary">
                                                    {student.dayTeacherName || '-'}
                                                  </Typography>
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