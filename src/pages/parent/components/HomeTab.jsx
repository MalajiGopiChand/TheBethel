import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Paper, Typography, Stack, Chip, Grid, Button, useTheme } from '@mui/material';
import { PersonRounded, CalendarMonthRounded, AttachMoneyRounded, LocalFireDepartmentRounded, AssignmentRounded, HelpOutlineRounded, EmojiEventsRounded, FamilyRestroomRounded, ArrowForwardRounded } from '@mui/icons-material';
import ActionGrid from '../../../components/ActionGrid';
import { parentAttendance } from '../../../utils/parentActivity';

export default function HomeTab({ student, parentLang = 'te', onSelectTab }) {
  const navigate = useNavigate(), theme = useTheme();
  const text = (en, te) => parentLang === 'te' ? te : en;
  if (!student) return <Alert severity="info">{text('No child is linked to your account. Please contact the school.', 'మీ ఖాతాకు పిల్లవాడి వివరాలు లేవు. పాఠశాలను సంప్రదించండి.')}</Alert>;
  const records = parentAttendance(student), present = records.filter(record => record.status === 'present').length;
  const attendance = records.length ? Math.round(present / records.length * 100) : 0;
  const openDetails = section => navigate(`/parent/child${section ? `?section=${section}` : ''}`);
  const actions = [
    { title: text('My Child Details', 'నా పిల్లవాడి వివరాలు'), icon: <PersonRounded />, colorStart: '#4FACFE', colorEnd: '#00F2FE', onClick: () => openDetails() },
    { title: text('View Attendance', 'హాజరు చూడండి'), icon: <CalendarMonthRounded />, colorStart: '#43E97B', colorEnd: '#38F9D7', onClick: () => openDetails('attendance') },
    { title: text('Dollar History', 'డాలర్ల చరిత్ర'), icon: <AttachMoneyRounded />, colorStart: '#FF5858', colorEnd: '#F09819', onClick: () => openDetails('dollars') },
    { title: text('Current Streak', 'వరుస హాజరు'), icon: <LocalFireDepartmentRounded />, colorStart: '#667eea', colorEnd: '#764ba2', onClick: () => openDetails('performance') },
    { title: text('Homework', 'హోమ్‌వర్క్'), icon: <AssignmentRounded />, colorStart: '#FA709A', colorEnd: '#FEE140', onClick: () => onSelectTab(1) },
    { title: text('Complaints & Help', 'ఫిర్యాదులు & సహాయం'), icon: <HelpOutlineRounded />, colorStart: '#4FACFE', colorEnd: '#00F2FE', onClick: () => navigate('/parent/complaints') },
    { title: text('Leaderboard', 'ర్యాంకులు'), icon: <EmojiEventsRounded />, colorStart: '#FF5858', colorEnd: '#F09819', onClick: () => onSelectTab(2) },
    { title: text('Family Profile', 'కుటుంబ వివరాలు'), icon: <FamilyRestroomRounded />, colorStart: '#8E2DE2', colorEnd: '#4A00E0', onClick: () => onSelectTab(3) },
  ];
  return <Box className="parent-enter">
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, mb: 3, borderRadius: 4, background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, color: '#fff' }}>
      <Typography variant="body2" sx={{ opacity: .9 }}>{text('Welcome to your parent dashboard', 'మీ పేరెంట్ డ్యాష్‌బోర్డ్‌కు స్వాగతం')}</Typography>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mt: 1, overflowWrap: 'anywhere' }}>{student.name}</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>{[student.classType, student.place || student.location, student.studentId].filter(Boolean).map((value, index) => <Chip key={index} size="small" label={value} sx={{ color: '#fff', bgcolor: '#ffffff26' }} />)}</Stack>
      <Button onClick={() => openDetails()} endIcon={<ArrowForwardRounded />} sx={{ mt: 2, color: '#fff', border: '1px solid #ffffff70' }}>{text('View full child profile', 'పిల్లవాడి పూర్తి వివరాలు')}</Button>
    </Paper>
    <Grid container spacing={1.5} sx={{ mb: 3 }}>
      {[[text('Attendance', 'హాజరు'), `${attendance}%`, 'attendance'], [text('Dollar Points', 'డాలర్లు'), `$${Number(student.dollarPoints) || 0}`, 'dollars'], [text('Current Streak', 'వరుస హాజరు'), Number(student.currentStreak) || 0, 'performance']].map(([label, value, section]) => <Grid item xs={4} key={section}><Paper component={Button} onClick={() => openDetails(section)} sx={{ width: '100%', p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', textTransform: 'none', borderRadius: 3, color: 'text.primary', height: '100%' }}><Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 800, color: 'primary.main' }}>{value}</Typography><Typography variant="caption" sx={{ textAlign: 'center' }}>{label}</Typography></Paper></Grid>)}
    </Grid>
    <Typography component="h2" variant="h6" fontWeight={800}>{text('Parent options', 'తల్లిదండ్రుల ఎంపికలు')}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 1.5 }}>{text('Choose an option to explore your child’s progress.', 'మీ పిల్లవాడి పురోగతి చూడటానికి ఒక ఎంపికను ఎంచుకోండి.')}</Typography>
    <Box sx={{ mx: -2 }}><ActionGrid actions={actions} /></Box>
  </Box>;
}
