import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Campaign as BroadcastIcon,
  VerifiedUser as VerifyIcon,
  WhatsApp as ChatIcon,
  CalendarToday as ScheduleIcon,
  AttachMoney as DollarIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';

// --- UPDATED IMPORTS (Fixed Paths) ---
import { db } from '../../../config/firebase';
import AttendanceCard from '../../../components/AttendanceCard';
import PodiumSection from '../../../components/PodiumSection';
import ActionGrid from '../../../components/ActionGrid';
// -------------------------------------

const AdminHomeTab = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    totalStudents: 0,
    attendancePercentage: 0,
    totalDollarsGiven: 0,
    todayPresentCount: 0,
    todayAbsentCount: 0,
    topStudents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Real-time listener for students collection
    const studentsQuery = query(collection(db, 'students'), orderBy('studentId'));
    
    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      calculateOverview(students);
    }, (error) => {
      console.error('Error fetching students:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Helper: Calculate total dollar points from rewards array
  const calculateDollarPoints = (studentData) => {
    const rewardsList = studentData.rewards || [];
    let calculatedPoints = 0;
    
    // Sum up dollars from rewards array
    for (const reward of rewardsList) {
      const points = reward.dollars;
      // Handle both number and string types safely
      if (typeof points === 'number') {
        calculatedPoints += points;
      } else if (typeof points === 'string') {
        calculatedPoints += parseInt(points, 10) || 0;
      }
    }
    
    // Use calculated points if available, otherwise fallback to legacy field
    return calculatedPoints > 0 ? calculatedPoints : (parseInt(studentData.dollarPoints, 10) || 0);
  };

  const calculateOverview = (students) => {
    try {
      // 1. Process each student to get their current point total
      const studentsWithPoints = students.map(student => ({
        ...student,
        calculatedTotal: calculateDollarPoints(student)
      }));

      const totalStudents = studentsWithPoints.length || 0;
      const today = format(new Date(), 'yyyy-MM-dd'); // Matches Android format
      
      // 2. Calculate Attendance
      const todayPresentCount = studentsWithPoints.filter(student => {
        const attendance = student?.attendance || [];
        // Check if any attendance string starts with today's date
        return attendance.some((dateStr) => dateStr && dateStr.startsWith && dateStr.startsWith(today));
      }).length;
      
      const attendancePercentage = totalStudents > 0
        ? Math.round((todayPresentCount / totalStudents) * 100)
        : 0;

      // 3. Calculate Global Dollar Stats
      const totalDollarsGiven = studentsWithPoints.reduce((sum, student) => 
        sum + (student.calculatedTotal || 0), 0
      );

      // 4. Calculate Top 3 Students (Leaderboard)
      const topStudents = studentsWithPoints
        .sort((a, b) => b.calculatedTotal - a.calculatedTotal)
        .slice(0, 3)
        .map(student => ({
          name: student.name || 'Unknown',
          dollars: student.calculatedTotal
        }));

      setOverview({
        totalStudents,
        attendancePercentage,
        totalDollarsGiven,
        todayPresentCount,
        todayAbsentCount: Math.max(0, totalStudents - todayPresentCount),
        topStudents: topStudents
      });

    } catch (error) {
      console.error('Error calculating overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Broadcast',
      subtitle: 'Send Alerts',
      icon: <BroadcastIcon />,
      colorStart: '#A18CD1',
      colorEnd: '#FBC2EB',
      isEnabled: true,
      onClick: () => navigate('/admin/notifications')
    },
    {
      title: 'Verify Teachers',
      subtitle: 'Approval',
      icon: <VerifyIcon />,
      colorStart: '#4FACFE',
      colorEnd: '#00F2FE',
      isEnabled: true,
      onClick: () => navigate('/admin/verify-teachers')
    },
    {
      title: 'Live Chat',
      subtitle: 'Chating',
      icon: <ChatIcon />,
      colorStart: '#43E97B',
      colorEnd: '#38F9D7',
      isEnabled: true,
      onClick: () => navigate('/teacher/messaging')
    },
    {
      title: 'Timetable',
      subtitle: 'Schedule',
      icon: <ScheduleIcon />,
      colorStart: '#FA709A',
      colorEnd: '#FEE140',
      isEnabled: true,
      onClick: () => navigate('/admin/timetable')
    },
    {
      title: 'Give Dollars',
      subtitle: 'Rewards',
      icon: <DollarIcon />,
      colorStart: '#FF5858',
      colorEnd: '#F09819',
      isEnabled: true,
      onClick: () => navigate('/teacher/dollars-giving')
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Attendance Progress Card */}
      {overview && (
        <AttendanceCard data={overview} canEdit={true} />
      )}

      {/* Top 3 Leaderboard Podium */}
      {overview?.topStudents && overview.topStudents.length > 0 && (
        <PodiumSection topStudents={overview.topStudents} />
      )}

      {/* Quick Actions Grid */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 1.5 }}>
          <Typography variant="h6" fontWeight="bold">
            Quick Actions
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/teacher/leaderboard')}
          >
            View Full Leaderboard
          </Button>
        </Box>
        <ActionGrid actions={quickActions} />
      </Box>

      {/* Stats Summary Cards */}
      <Grid container spacing={2} sx={{ mt: 2, px: 2, mb: 4 }}>
        <Grid item xs={6} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Students
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {overview.totalStudents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Attendance Rate
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {overview.attendancePercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Dollars Given
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ${overview.totalDollarsGiven}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminHomeTab;