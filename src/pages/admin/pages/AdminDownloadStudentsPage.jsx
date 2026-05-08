import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import { ArrowBack as BackIcon, Download as DownloadIcon } from '@mui/icons-material';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { handleBackNavigation } from '../../../utils/navigation';

const PLACE_OPTIONS = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

function downloadCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to download');
    return;
  }

  const headers = Object.keys(data[0]);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    if (s.includes('"')) return `"${s.replaceAll('"', '""')}"`;
    if (s.includes(',') || s.includes('\n')) return `"${s}"`;
    return s;
  };

  const csvContent = [headers.join(','), ...data.map((row) => headers.map((h) => esc(row[h])).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const AdminDownloadStudentsPage = () => {
  const navigate = useNavigate();
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCount, setLastCount] = useState(null);

  const handleBack = () => handleBackNavigation(navigate);

  const placeHelp = useMemo(() => {
    if (selectedPlace === 'All') return 'Exports all places';
    if (selectedPlace === 'Other') return 'Exports students not in the known places';
    return `Exports only: ${selectedPlace}`;
  }, [selectedPlace]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError('');
      setLastCount(null);

      const [studentsSnap, parentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), orderBy('studentId'))),
        getDocs(query(collection(db, 'parents'), orderBy('name')))
      ]);

      const parentsByStudentId = {};
      parentsSnap.forEach((d) => {
        const p = d.data();
        const sid = (p.studentId || p.studentRollNumber || '').trim?.() || p.studentId || '';
        if (!sid) return;
        parentsByStudentId[sid] = {
          parentName: p.name || '',
          parentPhone: p.phone || ''
        };
      });

      let students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (selectedPlace !== 'All') {
        students = students.filter((s) => {
          const loc = s.location || s.place || '';
          if (selectedPlace === 'Other') {
            return !['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'].includes(loc);
          }
          return loc === selectedPlace;
        });
      }

      const records = students.map((s) => {
        const sid = s.studentId || '';
        const parent = parentsByStudentId[sid] || {};
        const phoneFromStudent = s.parentPhone || s.mobileNumber || s.phone || s.phoneNumber || s.contactNumber || s.parentContact || '';
        return {
          'Student ID': sid,
          'Student Name': s.name || '',
          'Class': s.classType || '',
          'Place': s.location || s.place || '',
          'Parent Name': parent.parentName || s.fatherName || '',
          'Parent Phone': parent.parentPhone || phoneFromStudent || ''
        };
      });

      const filename = `students_parents_${selectedPlace}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(records, filename);
      setLastCount(records.length);
    } catch (e) {
      console.error('admin download students:', e);
      setError(e.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="page-shell page-glow-background" sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(22px)' }}>
        <Toolbar>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">Download Students (with Parents)</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Place</InputLabel>
              <Select value={selectedPlace} label="Place" onChange={(e) => setSelectedPlace(e.target.value)}>
                {PLACE_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">{placeHelp}</Typography>

            {lastCount != null && (
              <Chip label={`Exported rows: ${lastCount}`} color="success" variant="outlined" />
            )}

            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              disabled={loading}
              onClick={handleDownload}
              sx={{ borderRadius: 2 }}
            >
              {loading ? 'Preparing...' : 'Download CSV'}
            </Button>

            <Alert severity="info">
              Exports: Student Name, Student ID, Class, Place, Parent Name, Parent Phone.
            </Alert>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDownloadStudentsPage;

