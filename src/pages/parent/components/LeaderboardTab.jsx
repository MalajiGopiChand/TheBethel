import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Chip,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from '../../../services/studentData';
import { db } from '../../../config/firebase';
import { tParent } from '../../../utils/parentI18n';

const LeaderboardTab = ({ student, parentLang = 'te' }) => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    // Real-time listener for leaderboard
    setLoading(true);
    const leaderboardQuery = query(
      collection(db, 'students'),
      orderBy('dollarPoints', 'desc')
    );
    
    const unsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
      let studentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Calculate dollar points from rewards array
        const calculatedPoints = calculateDollarPoints(data);
        return {
          id: doc.id,
          ...data,
          dollarPoints: calculatedPoints
        };
      });
      
      // Filter out students NOT in the child's specific area ("of only her area only")
      const childLocation = student?.location || student?.place;
      if (childLocation) {
        studentsData = studentsData.filter(s => (s.location || s.place) === childLocation);
      }
      
      // Sort by calculated points (in case dollarPoints field is outdated)
      studentsData.sort((a, b) => (b.dollarPoints || 0) - (a.dollarPoints || 0));
      
      setError(false);
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      setError(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [student?.location, student?.place]);

  const text = (en, te) => parentLang === 'te' ? te : en;
  if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{text('Could not load the leaderboard. Please try again.', 'ర్యాంకులు లోడ్ కాలేదు. మళ్లీ ప్రయత్నించండి.')}</Alert>;
  const rank = students.findIndex(item => item.id === student?.id) + 1;
  return <Box className="parent-enter">
    <Typography component="h1" variant="h4" fontWeight={800}>{text('Growing together', 'కలిసి ఎదుగుదాం')}</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{text('Celebrating effort in your school community.', 'మన పాఠశాలలో ప్రతి ప్రయత్నాన్ని అభినందిద్దాం.')}</Typography>
    {!!rank && <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: '#fff6df' }}><Stack direction="row" gap={2} alignItems="center"><TrophyIcon sx={{ fontSize: 40, color: '#92651a' }} /><Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary">{text('YOUR CHILD’S RANK', 'మీ పిల్లవాడి ర్యాంకు')}</Typography><Typography variant="h5" fontWeight={800}>{student.name}</Typography></Box><Typography variant="h3" fontWeight={800} color="#805917">#{rank}</Typography></Stack></Paper>}
    <Paper elevation={0} sx={{ borderRadius: 4, p: { xs: 1, sm: 2 }, border: '1px solid #e2ebe5' }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1.5, py: 1 }}>{student?.place || student?.location || text('School leaderboard', 'పాఠశాల ర్యాంకులు')}</Typography>
      {students.length ? students.map((item, index) => <Stack key={item.id} direction="row" alignItems="center" gap={1.5} sx={{ p: 1.5, my: .5, borderRadius: 3, bgcolor: item.id === student?.id ? '#eaf2ed' : 'transparent' }}>
        <Typography sx={{ width: 24, flexShrink: 0, color: '#637a70', fontWeight: 700 }}>{index + 1}</Typography>
        <Avatar sx={{ bgcolor: index < 3 ? '#f5e8c7' : '#edf2ef', color: '#526b60', width: 40, height: 40 }}>{item.name?.[0]}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={item.id === student?.id ? 800 : 600}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.classType}</Typography></Box>
        <Typography fontWeight={800} color="primary" sx={{ whiteSpace: 'nowrap' }}>{item.dollarPoints || 0} $</Typography>
      </Stack>) : <Typography sx={{ p: 3 }} color="text.secondary">{text('No rankings to show yet.', 'ఇంకా ర్యాంకులు లేవు.')}</Typography>}
    </Paper>
  </Box>;
};
export default LeaderboardTab;
