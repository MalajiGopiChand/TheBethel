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
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Button,
  Chip
} from '@mui/material';
import { ArrowBack as BackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { handleBackNavigation } from '../../../utils/navigation';

const ADMIN_EMAILS = ['gop1@gmail.com', 'premkumartenali@gmail.com'];

const AdminComplaintsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAdmin = currentUser?.role === UserRole.ADMIN || ADMIN_EMAILS.includes(currentUser?.email);
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setError('');
    }, (err) => {
      console.error('complaints read:', err);
      setError(err.message || 'Failed to load complaints.');
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await deleteDoc(doc(db, 'complaints', id));
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  return (
    <Box className="page-shell page-glow-background" sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'transparent', color: '#111', borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(22px)' }}>
        <Toolbar>
          <IconButton onClick={() => handleBackNavigation(navigate, currentUser)} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">Parent Complaints & Issues</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
            <Typography color="text.secondary">No complaints found.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card key={item.id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ minWidth: 250 }}>
                      <Typography variant="h6" fontWeight="bold">{item.title || 'No title'}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Parent: {item.parentName || '-'} ({item.parentEmail || '-'})
                      </Typography>
                      {item.studentName && (
                        <Typography variant="body2" color="text.secondary">
                          Student Name: {item.studentName}
                        </Typography>
                      )}
                      {item.studentId && (
                        <Typography variant="body2" color="text.secondary">
                          Student ID: {item.studentId}
                        </Typography>
                      )}
                      {item.parentPhone && (
                        <Typography variant="body2" color="text.secondary">
                          Parent Phone: {item.parentPhone}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" label={item.languageHint || 'unknown'} />
                        <Chip size="small" color="warning" label={item.status || 'open'} />
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : 'Date unavailable'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                    <Typography whiteSpace="pre-wrap">{item.description || '-'}</Typography>
                  </Paper>

                  {item.voiceNoteUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Voice note</Typography>
                      <audio controls src={item.voiceNoteUrl} style={{ width: '100%' }} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default AdminComplaintsPage;
