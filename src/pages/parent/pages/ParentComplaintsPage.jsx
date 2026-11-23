import '../parent.css';
import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Typography,
  IconButton,
  InputAdornment,
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
  ArrowBack as BackIcon, ForumRounded, PeopleRounded, PersonRounded, SchoolRounded, PhoneRounded, BadgeRounded,
  DescriptionOutlined, LayersOutlined, EditOutlined, SendRounded, AssignmentOutlined, ScheduleRounded,
} from '@mui/icons-material';
import { addDoc, collection, serverTimestamp, query, where, getDoc, doc, onSnapshot } from '../../../services/studentData';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { UserRole } from '../../../types';

const ParentComplaintsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { student, parentLang } = useOutletContext();
  const studentName = student?.name || currentUser?.studentName || '';
  const [profilePhone, setProfilePhone] = useState('');
  const parentPhone = String(profilePhone || student?.parentPhone || student?.phone || student?.contactNumber || student?.parentContact || currentUser?.phone || '').trim();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [issueType, setIssueType] = useState('homework');

  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.PARENT) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    let active = true;
    getDoc(doc(db, 'parents', currentUser.uid)).then(snapshot => {
      const profile = snapshot.data();
      if (active) setProfilePhone(profile?.phone || profile?.parentPhone || profile?.contactNumber || '');
    }).catch(error => console.error('Could not load parent contact', error));
    return () => { active = false; };
  }, [currentUser?.uid]);

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

  const label = (en, te) => parentLang === 'te' ? te : en;
  const fieldIcon = Icon => <InputAdornment position="start"><Icon fontSize="small" /></InputAdornment>;
  return (
    <main className="complaint-page">
      <header className="complaint-hero">
        <IconButton aria-label={label('Go back', 'వెనక్కి')} onClick={() => handleBackNavigation(navigate, currentUser)}><BackIcon /></IconButton>
        <h1>{label('Raise Complaint / Issue', 'ఫిర్యాదు / సమస్య నమోదు')}</h1>
        <p>{label('Describe the issue in English or Telugu. You can track its status below.', 'సమస్యను తెలుగు లేదా ఇంగ్లీష్‌లో వివరించండి. దాని స్థితిని కింద చూడండి.')}</p>
        <ForumRounded className="complaint-art" aria-hidden="true" />
      </header>
      <section className="complaint-card">
        <h2><PeopleRounded />{label('Complaint For', 'ఫిర్యాదు వివరాలు')}</h2>
        <dl className="complaint-family">{[
          [PersonRounded, label('Parent Name', 'తల్లిదండ్రి పేరు'), currentUser?.name],
          [SchoolRounded, label('Student Name', 'విద్యార్థి పేరు'), studentName],
          [PhoneRounded, label('Parent Phone', 'తల్లిదండ్రి ఫోన్'), parentPhone],
          [BadgeRounded, label('Student ID', 'విద్యార్థి ఐడి'), currentUser?.studentId]
        ].map(([Icon, name, value]) => <div key={name}><Icon aria-hidden="true" /><dt>{name}</dt><dd>{value || '—'}</dd></div>)}</dl>
      </section>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{label(success, 'ఫిర్యాదు విజయవంతంగా పంపబడింది.')}</Alert>}
      <form className="complaint-card complaint-form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label={parentLang === 'te' ? 'శీర్షిక' : 'Title'}
                disabled={submitting}
                InputProps={{ startAdornment: fieldIcon(DescriptionOutlined) }}
                inputProps={{ maxLength: 150 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
              <TextField
                select required
                InputProps={{ startAdornment: fieldIcon(LayersOutlined) }}
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
                InputProps={{ startAdornment: fieldIcon(EditOutlined) }}
                inputProps={{ maxLength: 5000 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                multiline
                minRows={4}
              />

              <Button startIcon={!submitting && <SendRounded />} type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CircularProgress size={20} color="inherit" /> : (parentLang === 'te' ? 'ఫిర్యాదు పంపు' : 'Submit Complaint')}
              </Button>
            </Stack>
      </form>
      <section className="complaint-card">
          <h2><AssignmentOutlined />{label('Your Complaints', 'మీ ఫిర్యాదులు')}
            {!historyLoading && !historyError && <small>{history.length} {label(history.length === 1 ? 'Complaint' : 'Complaints', 'ఫిర్యాదులు')}</small>}
          </h2>
          {historyError && <Alert severity="error">{historyError}</Alert>}
          {historyLoading ? <CircularProgress size={24} /> : history.length === 0 && !historyError ? <Typography color="text.secondary">{label('You have not submitted any complaints yet.', 'మీరు ఇంకా ఫిర్యాదులు పంపలేదు.')}</Typography> : (
            <Stack spacing={2}>{history.map(item => <Paper key={item.id} variant="outlined" className="complaint-entry"><DescriptionOutlined aria-hidden="true" /><div>
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography fontWeight="bold" sx={{ overflowWrap: 'anywhere' }}>{item.title}</Typography>
                <Chip size="small" label={item.status === 'resolved' ? label('Resolved', 'పరిష్కరించబడింది') : !item.status || item.status === 'open' ? label('Open', 'పెండింగ్') : item.status} color={item.status === 'resolved' ? 'success' : 'warning'} />
              </Stack>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 1 }}>{item.description}</Typography>
              <Typography className="complaint-time" variant="caption" color="text.secondary"><ScheduleRounded />{item.createdAt?.toDate?.().toLocaleString(parentLang === 'te' ? 'te-IN' : 'en-GB') || label('Saving…', 'సేవ్ అవుతోంది…')}</Typography>
            </div></Paper>)}</Stack>
          )}
      </section>
    </main>
  );
};

export default ParentComplaintsPage;
