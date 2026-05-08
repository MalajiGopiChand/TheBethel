import React, { useEffect, useRef, useState } from 'react';
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
  Chip,
  CircularProgress,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { UserRole } from '../../../types';
import { getParentLang } from '../../../utils/parentI18n';

const ParentComplaintsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
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

      // Strong fallback: collect parent phone directly from parents collection too.
      const parentByStudentQuery = query(collection(db, 'parents'), where('studentId', '==', currentUser.studentId));
      const parentByStudentSnap = await getDocs(parentByStudentQuery);
      if (!parentByStudentSnap.empty) {
        const p = parentByStudentSnap.docs[0].data();
        const parentDbPhone = String(p.phone || p.parentPhone || p.contactNumber || '').trim();
        if (parentDbPhone) setParentPhone(parentDbPhone);
      } else if (currentUser?.uid) {
        const parentOwnQuery = query(collection(db, 'parents'), where('uid', '==', currentUser.uid));
        const parentOwnSnap = await getDocs(parentOwnQuery);
        if (!parentOwnSnap.empty) {
          const p = parentOwnSnap.docs[0].data();
          const parentDbPhone = String(p.phone || p.parentPhone || p.contactNumber || '').trim();
          if (parentDbPhone) setParentPhone(parentDbPhone);
        }
      }
    };
    fetchStudent().catch((e) => console.error('fetch student for complaint', e));
  }, [currentUser]);

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone permission denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      let voiceNoteUrl = '';

      if (audioBlob) {
        const fileRef = ref(storage, `complaints_voice_notes/${currentUser.uid}_${Date.now()}.webm`);
        await uploadBytes(fileRef, audioBlob);
        voiceNoteUrl = await getDownloadURL(fileRef);
      }

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
        voiceNoteUrl,
        status: 'open',
        createdAt: serverTimestamp()
      });

      setTitle('');
      setDescription('');
      setAudioBlob(null);
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
    <Box className="page-shell page-glow-background" sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'transparent', color: '#111', borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(22px)' }}>
        <Toolbar>
          <IconButton onClick={() => handleBackNavigation(navigate, currentUser)} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            {parentLang === 'te' ? 'ఫిర్యాదు / సమస్య నమోదు' : 'Raise Complaint / Issue'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {parentLang === 'te'
              ? 'మీరు తెలుగు లేదా ఇంగ్లీష్‌లో టైప్ చేయవచ్చు. వాయిస్ నోట్ కూడా జోడించవచ్చు.'
              : 'You can type in English or Telugu. You can also attach a voice note.'}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
              <TextField
                select
                label={parentLang === 'te' ? 'సమస్య రకం' : 'Issue Type'}
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                fullWidth
              >
                <MenuItem value="homework">{parentLang === 'te' ? 'హోమ్‌వర్క్' : 'Homework'}</MenuItem>
                <MenuItem value="attendance">{parentLang === 'te' ? 'హాజరు' : 'Attendance'}</MenuItem>
                <MenuItem value="fees">{parentLang === 'te' ? 'ఫీజులు' : 'Fees'}</MenuItem>
                <MenuItem value="behaviour">{parentLang === 'te' ? 'ప్రవర్తన' : 'Behaviour'}</MenuItem>
                <MenuItem value="transport">{parentLang === 'te' ? 'రవాణా' : 'Transport'}</MenuItem>
                <MenuItem value="other">{parentLang === 'te' ? 'ఇతర' : 'Other'}</MenuItem>
              </TextField>
              <TextField
                label={parentLang === 'te' ? 'వివరణ (తెలుగు / ఇంగ్లీష్)' : 'Description (English / Telugu)'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                multiline
                minRows={4}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                {!isRecording ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<MicIcon />}
                    onClick={startRecording}
                  >
                    {parentLang === 'te' ? 'వాయిస్ నోట్ రికార్డ్ చేయండి' : 'Record Voice Note'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={stopRecording}
                  >
                    {parentLang === 'te' ? 'రికార్డ్ ఆపు' : 'Stop Recording'}
                  </Button>
                )}

                {audioBlob && (
                  <>
                    <Chip label={parentLang === 'te' ? 'వాయిస్ నోట్ జత అయింది' : 'Voice note attached'} color="success" />
                    <Button
                      size="small"
                      color="inherit"
                      startIcon={<DeleteIcon />}
                      onClick={() => setAudioBlob(null)}
                    >
                      {parentLang === 'te' ? 'తొలగించు' : 'Remove'}
                    </Button>
                  </>
                )}
              </Box>

              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CircularProgress size={20} color="inherit" /> : (parentLang === 'te' ? 'ఫిర్యాదు పంపు' : 'Submit Complaint')}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ParentComplaintsPage;
