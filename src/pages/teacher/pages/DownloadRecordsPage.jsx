import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Description as PDFIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { handleBackNavigation } from '../../../utils/navigation';

const DownloadRecordsPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };
  const [loading, setLoading] = useState(false);
  const [recordType, setRecordType] = useState('attendance');
  const [selectedClass, setSelectedClass] = useState('All');

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to download');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const studentsSnapshot = await getDocs(
        query(collection(db, 'students'), orderBy('studentId'))
      );
      
      let students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (selectedClass !== 'All') {
        students = students.filter(s => s.classType === selectedClass);
      }

      const records = students.map(student => {
        const attendance = student.attendance || [];
        const absentDates = student.absentDates || [];
        const totalDays = attendance.length + absentDates.length;
        const attendancePercentage = totalDays > 0
          ? Math.round((attendance.length / totalDays) * 100)
          : 0;

        return {
          'Student ID': student.studentId,
          'Name': student.name,
          'Class': student.classType,
          'Location': student.location,
          'Present Days': attendance.length,
          'Absent Days': absentDates.length,
          'Total Days': totalDays,
          'Attendance %': `${attendancePercentage}%`,
          'Dollar Points': student.dollarPoints || 0,
          'Current Streak': student.currentStreak || 0
        };
      });

      const filename = `attendance_records_${selectedClass}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(records, filename);
    } catch (error) {
      console.error('Error downloading records:', error);
      alert('Failed to download records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadStudentList = async () => {
    try {
      setLoading(true);
      const studentsSnapshot = await getDocs(
        query(collection(db, 'students'), orderBy('studentId'))
      );
      
      let students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (selectedClass !== 'All') {
        students = students.filter(s => s.classType === selectedClass);
      }

      const records = students.map(student => ({
        'Student ID': student.studentId,
        'Name': student.name,
        'Father Name': student.fatherName || '',
        'Mother Name': student.motherName || '',
        'Class': student.classType,
        'Location': student.location,
        'Dollar Points': student.dollarPoints || 0,
        'Current Streak': student.currentStreak || 0
      }));

      const filename = `student_list_${selectedClass}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(records, filename);
    } catch (error) {
      console.error('Error downloading student list:', error);
      alert('Failed to download student list: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadDollarHistory = async () => {
    try {
      setLoading(true);
      const studentsSnapshot = await getDocs(
        query(collection(db, 'students'), orderBy('studentId'))
      );
      
      let students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (selectedClass !== 'All') {
        students = students.filter(s => s.classType === selectedClass);
      }

      const records = [];
      students.forEach(student => {
        const rewards = student.rewards || [];
        if (rewards.length > 0) {
          rewards.forEach(reward => {
            records.push({
              'Student ID': student.studentId,
              'Student Name': student.name,
              'Class': student.classType,
              'Date': reward.date || '',
              'Dollars': reward.dollars || 0,
              'Reason': reward.reason || '',
              'Teacher': reward.teacher || ''
            });
          });
        } else {
          records.push({
            'Student ID': student.studentId,
            'Student Name': student.name,
            'Class': student.classType,
            'Date': '',
            'Dollars': 0,
            'Reason': 'No rewards recorded',
            'Teacher': ''
          });
        }
      });

      const filename = `dollar_history_${selectedClass}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(records, filename);
    } catch (error) {
      console.error('Error downloading dollar history:', error);
      alert('Failed to download dollar history: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    switch (recordType) {
      case 'attendance':
        downloadAttendanceRecords();
        break;
      case 'students':
        downloadStudentList();
        break;
      case 'dollars':
        downloadDollarHistory();
        break;
      default:
        alert('Please select a record type');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Download Records
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Record Type
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Record Type</InputLabel>
                  <Select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    label="Record Type"
                  >
                    <MenuItem value="attendance">Attendance Records</MenuItem>
                    <MenuItem value="students">Student List</MenuItem>
                    <MenuItem value="dollars">Dollar History</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Filter by Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    label="Filter by Class"
                  >
                    <MenuItem value="All">All Classes</MenuItem>
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Primary">Primary</MenuItem>
                    <MenuItem value="Secondary">Secondary</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleDownload}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Downloading...' : 'Download CSV'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Downloads
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="info">
                    <strong>Attendance Records:</strong> Download complete attendance data including present/absent days and percentages.
                  </Alert>
                  <Alert severity="info">
                    <strong>Student List:</strong> Download complete list of all students with their details.
                  </Alert>
                  <Alert severity="info">
                    <strong>Dollar History:</strong> Download all dollar rewards given to students.
                  </Alert>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  All downloads are in CSV format and can be opened in Excel or Google Sheets.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DownloadRecordsPage;


