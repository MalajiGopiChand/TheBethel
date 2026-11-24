import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { collection, onSnapshot } from '../../../services/notifyingFirestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { isActivityAdmin } from '../../../utils/teacherActivity';
import SchoolLoader from '../../../components/SchoolLoader';

export default function TeacherProgressPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const admin = isActivityAdmin(currentUser);
  useEffect(() => {
    setLoading(true); setError('');
    return onSnapshot(collection(db, 'teachers'), snapshot => {
      setTeachers(snapshot.docs.map(item => ({ ...item.data(), uid: item.id })).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setLoading(false);
    }, () => { setError('Unable to load teachers. Check your connection and retry.'); setLoading(false); });
  }, [retry]);
  const list = teachers.filter(teacher => (admin || teacher.uid === currentUser?.uid) && (teacher.name || '').toLowerCase().includes(search.toLowerCase()));
  return <Box className="admin-page" sx={{ py: 3, minHeight: '100vh' }}><Container maxWidth="md">
    <Button startIcon={<ArrowBack />} onClick={() => navigate(admin ? '/admin/dashboard?tab=staff' : '/teacher/dashboard?tab=3')}>Dashboard</Button>
    <Typography component="h1" variant="h4" fontWeight={900} sx={{ mt: 2 }}>Teacher Progress & Reports</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Choose View to see rewards, reports, homework, Sunday attendance and offerings.</Typography>
    <TextField label="Search teacher name" fullWidth value={search} onChange={event => setSearch(event.target.value)} sx={{ mb: 2 }} />
    {error && <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{error}</Alert>}
    {loading ? <SchoolLoader message="Preparing the teachers list" /> : <Paper sx={{ p: 2 }}><Stack spacing={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, pb: 1 }}><Typography fontWeight={800}>Teacher name</Typography><Typography fontWeight={800}>Action</Typography></Box>
      {list.map(teacher => <Box key={teacher.uid} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}><Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>{teacher.name || 'Unnamed teacher'}</Typography><Button variant="contained" endIcon={<ArrowForward />} aria-label={`View ${teacher.name || 'teacher'} activity`} onClick={() => navigate(admin ? `/admin/teacher-progress/${encodeURIComponent(teacher.uid)}` : '/teacher/profile')}>View</Button></Box>)}
      {!list.length && !error && <Typography sx={{ p: 3 }}>No teachers found.</Typography>}
    </Stack></Paper>}
  </Container></Box>;
}
