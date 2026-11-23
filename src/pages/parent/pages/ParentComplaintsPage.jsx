import '../parent.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Container,
  Paper,
  TextField,
  Button,
  Alert,
  Stack,
  CircularProgress,
  MenuItem,
  Chip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { addDoc, collection, serverTimestamp, query, where, getDocs, getDoc, doc, onSnapshot } from '../../../services/studentData';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { UserRole } from '../../../types';
import { getParentLang } from '../../../utils/parentI18n';

const ParentComplaintsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [issueType, setIssueType] = useState('homework');
  const parentLang = getParentLang();

  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.PARENT) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!currentUser?.studentId) return;
      const q = query(collection(db, 'students'), where('studentId', '==', currentUser.studentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const s = snap.docs[0].data();
        setStudentName(s.name || '');
        setParentPhone(String(s.parentPhone || s.phone || s.contactNumber || s.parentContact || currentUser?.phone || '').trim());
      } else {
        setParentPhone(String(currentUser?.phone || '').trim());
      }

      // Read only this parent's UID document; collection-wide queries are denied to parents.
      const ownParent = await getDoc(doc(db, 'parents', currentUser.uid));
      if (ownParent.exists()) {
        const parent = ownParent.data();
        const phone = String(parent.phone || parent.parentPhone || parent.contactNumber || '').trim();
        if (phone) setParentPhone(phone);
      }

    };
    setParentPhone(currentUser?.phone || '');
    setStudentName(currentUser?.studentName || '');
    fetchStudent().catch((e) => console.error('fetch student for complaint', e));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    return onSnapshot(query(collection(db, 'complaints'), where('parentId', '==', currentUser.uid)), snap => {
      setHistory(snap.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setHistoryLoading(false);
      setHistoryError('');
    }, () => { setHistoryLoading(false); setHistoryError('Could not load your complaints. Please try again later.'); });
  }, [currentUser?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess('');

    if (!title.trim() || !description.trim()) {
      setError('Please fill title and description.');
      return;
    }

    if (!currentUser?.uid) {
      setError('Please login again.');
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, 'complaints'), {
        title: title.trim(),
        description: description.trim(),
        issueType,
        languageHint: /[\u0C00-\u0C7F]/.test(`${title} ${description}`) ? 'telugu' : 'english',
        parentId: currentUser.uid,
        parentName: currentUser.name || 'Parent',
        parentEmail: currentUser.email || '',
        parentPhone: parentPhone || '',
        studentId: currentUser.studentId || '',
        studentName: studentName || '',
        status: 'open',
        createdAt: serverTimestamp()
      });

      setTitle('');
      setDescription('');
      setIssueType('homework');
      setSuccess('Complaint/issue submitted successfully.');
    } catch (err) {
      console.error('submit complaint:', err);
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="parent-shell" sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', backgroundImage: 'none', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(22px)' }}>
        <Toolbar>
          <IconButton aria-label="Go back" onClick={() => handleBackNavigation(navigate, currentUser)} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            {parentLang === 'te' ? 'ఫిర్యాదు / సమస్య నమోదు' : 'Raise Complaint / Issue'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container className="parent-enter" maxWidth="md" sx={{ py: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {parentLang === 'te'
              ? 'మీరు తెలుగు లేదా ఇంగ్లీష్‌లో సమస్య వివరాలను రాయవచ్చు.'
              : 'Describe the issue in English or Telugu. You can track its status below.'}
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Stack spacing={0.5}>
              <Typography variant="body2"><strong>{parentLang === 'te' ? 'తల్లిదండ్రి పేరు' : 'Parent Name'}:</strong> {currentUser?.name || '-'}</Typography>
              <Typography variant="body2"><strong>{parentLang === 'te' ? 'తల్లిదండ్రి ఫోన్' : 'Parent Phone'}:</strong> {parentPhone || '-'}</Typography>
              <Typography variant="body2"><strong>{parentLang === 'te' ? 'విద్యార్థి పేరు' : 'Student Name'}:</strong> {studentName || '-'}</Typography>
              <Typography variant="body2"><strong>{parentLang === 'te' ? 'విద్యార్థి ఐడి' : 'Student ID'}:</strong> {currentUser?.studentId || '-'}</Typography>
            </Stack>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label={parentLang === 'te' ? 'శీర్షిక' : 'Title'}
                disabled={submitting}
                inputProps={{ maxLength: 150 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
              <TextField
                select
                label={parentLang === 'te' ? 'సమస్య రకం' : 'Issue Type'}
                disabled={submitting}
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                fullWidth
              >
                <MenuItem value="attendance">{parentLang === 'te' ? 'హాజరు' : 'Attendance'}</MenuItem>
                <MenuItem value="dollars">{parentLang === 'te' ? 'డాలర్లు' : 'Dollars'}</MenuItem>
                <MenuItem value="homework">{parentLang === 'te' ? 'హోమ్‌వర్క్' : 'Homework'}</MenuItem>
                <MenuItem value="other">{parentLang === 'te' ? 'ఇతర' : 'Other'}</MenuItem>
              </TextField>
              <TextField
                label={parentLang === 'te' ? 'వివరణ (తెలుగు / ఇంగ్లీష్)' : 'Description (English / Telugu)'}
                disabled={submitting}
                inputProps={{ maxLength: 5000 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                multiline
                minRows={4}
              />

              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CircularProgress size={20} color="inherit" /> : (parentLang === 'te' ? 'ఫిర్యాదు పంపు' : 'Submit Complaint')}
              </Button>
            </Stack>
          </Box>
        </Paper>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Your complaints</Typography>
          {historyError && <Alert severity="error">{historyError}</Alert>}
          {historyLoading ? <CircularProgress size={24} /> : history.length === 0 && !historyError ? <Typography color="text.secondary">You have not submitted any complaints yet.</Typography> : (
            <Stack spacing={2}>{history.map(item => <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography fontWeight="bold" sx={{ overflowWrap: 'anywhere' }}>{item.title}</Typography>
                <Chip size="small" label={item.status || 'open'} color={item.status === 'resolved' ? 'success' : 'warning'} />
              </Stack>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 1 }}>{item.description}</Typography>
              <Typography variant="caption" color="text.secondary">{item.createdAt?.toDate?.().toLocaleString() || 'Saving…'}</Typography>
            </Paper>)}</Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ParentComplaintsPage;
