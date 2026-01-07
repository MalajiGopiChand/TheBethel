import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  AttachMoney as DollarIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const ViewStudentsPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');

  // Helper function to calculate dollar points from rewards array
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

  useEffect(() => {
    // Real-time listener for students
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const calculatedPoints = calculateDollarPoints(data);
        return {
          id: doc.id,
          ...data,
          dollarPoints: calculatedPoints
        };
      });
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching students:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.fatherName && student.fatherName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesClass = selectedClass === 'All' || student.classType === selectedClass;
    const location = student.location || student.place || '';
    const matchesPlace = selectedPlace === 'All' || 
      (selectedPlace === 'Other' 
        ? !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(location)
        : location === selectedPlace);
    
    return matchesSearch && matchesClass && matchesPlace;
  });

  const handleViewDetails = (studentId) => {
    navigate(`/teacher/student-details?id=${studentId}`);
  };

  const attendanceList = (student) => student.attendance || [];
  const absentDates = (student) => student.absentDates || [];
  const getAttendancePercentage = (student) => {
    const present = attendanceList(student).length;
    const absent = absentDates(student).length;
    const total = present + absent;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/teacher/dashboard')}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            View Students
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>

        <Card sx={{ mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6">Total Students: {filteredStudents.length}</Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name, roll number, or father's name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Class"
            >
              <MenuItem value="All">All Classes</MenuItem>
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Primary">Primary</MenuItem>
              <MenuItem value="Secondary">Secondary</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Place</InputLabel>
            <Select
              value={selectedPlace}
              onChange={(e) => setSelectedPlace(e.target.value)}
              label="Place"
            >
              <MenuItem value="All">All Places</MenuItem>
              <MenuItem value="Kandrika">Kandrika</MenuItem>
              <MenuItem value="Krishna Lanka">Krishna Lanka</MenuItem>
              <MenuItem value="Gandhiji Conly">Gandhiji Conly</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Alert severity="info">No students found matching your criteria.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Roll No</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Father Name</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Attendance</strong></TableCell>
                  <TableCell><strong>Dollar Points</strong></TableCell>
                  <TableCell><strong>Streak</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.fatherName || '-'}</TableCell>
                    <TableCell>
                      <Chip label={student.classType} size="small" />
                    </TableCell>
                    <TableCell>{student.location || student.place || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {attendanceList(student).length} days ({getAttendancePercentage(student)}%)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<DollarIcon />}
                        label={`$${student.dollarPoints || 0}`}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${student.currentStreak || 0} days`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(student.studentId)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
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

export default ViewStudentsPage;

