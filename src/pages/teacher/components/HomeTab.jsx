import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  EventNote as AttendanceIcon,
  Assignment as HomeworkIcon,
  AttachMoney as DollarIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import AttendanceCard from '../../../components/AttendanceCard';
import PodiumSection from '../../../components/PodiumSection';
import ActionGrid from '../../../components/ActionGrid';
import AnnouncementsSection from '../../../components/AnnouncementsSection';

const HomeTab = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    totalStudents: 0,
    attendancePercentage: 0,
    totalDollarsGiven: 0,
    totalRewards: 0,
    todayPresentCount: 0,
    todayAbsentCount: 0,
    topStudents: []
  });
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);


  useEffect(() => {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const announcementsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const audience = data.audience || 'All';
        // Show announcements for Teachers or All
        if (audience === 'Teachers' || audience === 'All') {
          let createdAt;
          if (data.createdAt) {
            // Handle Firestore Timestamp
            if (typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            } else {
              createdAt = new Date();
            }
          } else {
            createdAt = new Date();
          }
          announcementsData.push({
            title: data.title || '',
            message: data.message || '',
            date: format(createdAt, 'MMM dd, yyyy'),
            audience: audience,
            isImportant: data.isImportant || false
          });
        }
      });
      setAnnouncements(announcementsData.slice(0, 5)); // Show last 5
    });

    return () => unsubscribe();
  }, []);

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
    // Real-time listener for students overview
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const students = snapshot.docs.map(doc => {
        const data = doc.data();
        const calculatedPoints = calculateDollarPoints(data);
        return {
          id: doc.id,
          ...data,
          dollarPoints: calculatedPoints
        };
      });

      const totalStudents = students.length;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const todayPresentCount = students.filter(student => 
        (student.attendance || []).some((date) => date.startsWith(today))
      ).length;
      
      const todayAbsentCount = totalStudents - todayPresentCount;
      const attendancePercentage = totalStudents > 0
        ? Math.round((todayPresentCount / totalStudents) * 100)
        : 0;

      const totalDollarsGiven = students.reduce((sum, student) => 
        sum + (student.dollarPoints || 0), 0
      );

      const studentDollarMap = new Map();
      students.forEach(student => {
        const current = studentDollarMap.get(student.name) || 0;
        studentDollarMap.set(student.name, current + (student.dollarPoints || 0));
      });

      const topStudents = Array.from(studentDollarMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, dollars]) => ({ name, dollars }));

      setOverview({
        totalStudents,
        attendancePercentage,
        totalDollarsGiven,
        totalRewards: 0,
        todayPresentCount,
        todayAbsentCount,
        topStudents
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching overview:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const quickActions = [
    {
      title: 'Live Chat',
      icon: <ChatIcon />,
      colorStart: '#4FACFE',
      colorEnd: '#00F2FE',
      isEnabled: true,
      onClick: () => navigate('/teacher/messaging')
    },
    {
      title: 'Mark Attendance',
      icon: <AttendanceIcon />,
      colorStart: '#43E97B',
      colorEnd: '#38F9D7',
      isEnabled: true,
      onClick: () => navigate('/teacher/attendance')
    },
    {
      title: 'Homework',
      icon: <HomeworkIcon />,
      colorStart: '#FA709A',
      colorEnd: '#FEE140',
      isEnabled: true,
      onClick: () => navigate('/teacher/homework')
    },
    {
      title: 'Give Dollars',
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
      <AttendanceCard data={overview} canEdit={true} />

      {announcements.length > 0 && (
        <Box sx={{ mt: 2, px: 2 }}>
          <AnnouncementsSection announcements={announcements} />
        </Box>
      )}

      {overview.topStudents.length > 0 && (
        <PodiumSection topStudents={overview.topStudents} />
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ px: 2, mb: 1.5 }}>
          Quick Actions
        </Typography>
        <ActionGrid actions={quickActions} />
      </Box>

      <Grid container spacing={2} sx={{ mt: 2, px: 2 }}>
        <Grid item xs={6} sm={4}>
          <Card>
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
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Attendance
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {overview.attendancePercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Dollars Given
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

export default HomeTab;

