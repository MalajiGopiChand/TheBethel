import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as PointsIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const ADMIN_EMAILS = ['gop1@gmail.com', 'premkumartenali@gmail.com', 'admin@gmail.com'];

const TeacherAttendancePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState(''); // yyyy-MM-dd
  const [showDialog, setShowDialog] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [dialogValues, setDialogValues] = useState({
    teacherName: '',
    className: '',
    teachingPlace: '',
    lessonTopicsCovered: '',
    teachingMethodsUsed: '',
  });

  const [pointsDialogReport, setPointsDialogReport] = useState(null);
  const [pointsInput, setPointsInput] = useState('');
  const [deleteDialogReport, setDeleteDialogReport] = useState(null);

  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email || '');

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday
  const isSunday = dayOfWeek === 0;
  const isModificationAllowed = isSunday || isAdmin;

  const currentUserUid = currentUser?.uid || '';
  const currentUserName = currentUser?.name || currentUser?.displayName || '';

  // Load reports with optional date filter
  useEffect(() => {
    setLoading(true);
    setError('');

    let q = query(collection(db, 'teacherProgress'), orderBy('createdAt', 'desc'));

    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map((v) => parseInt(v, 10));
      const start = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
      const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0).getTime();

      q = query(
        collection(db, 'teacherProgress'),
        where('createdAt', '>=', start),
        where('createdAt', '<', end),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docRef) => ({
          id: docRef.id,
          ...docRef.data(),
        }));
        setReports(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to load reports.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate]);

  const handleOpenNew = () => {
    if (!isModificationAllowed) {
      window.alert('Reports can only be submitted on Sundays.');
      return;
    }

    const base = {
      teacherName: isAdmin ? '' : currentUserName,
      teacherUid: currentUserUid,
      className: '',
      teachingPlace: '',
      lessonTopicsCovered: '',
      teachingMethodsUsed: '',
    };
    setEditingReport(null);
    setDialogValues({
      teacherName: base.teacherName,
      className: base.className,
      teachingPlace: base.teachingPlace,
      lessonTopicsCovered: base.lessonTopicsCovered,
      teachingMethodsUsed: base.teachingMethodsUsed,
    });
    setShowDialog(true);
  };

  const handleOpenEdit = (report) => {
    const isOwner = report.teacherUid === currentUserUid;
    if (!isModificationAllowed && !isAdmin) {
      window.alert('Editing is only allowed on Sundays.');
      return;
    }
    if (!isAdmin && !isOwner) {
      window.alert('You can only edit your own reports.');
      return;
    }

    setEditingReport(report);
    setDialogValues({
      teacherName: report.teacherName || '',
      className: report.className || '',
      teachingPlace: report.teachingPlace || '',
      lessonTopicsCovered: report.lessonTopicsCovered || '',
      teachingMethodsUsed: report.teachingMethodsUsed || '',
    });
    setShowDialog(true);
  };

  const handleSaveDialog = async () => {
    const now = Date.now();
    const payload = {
      teacherName: dialogValues.teacherName || currentUserName || 'Teacher',
      teacherUid: editingReport?.teacherUid || currentUserUid,
      className: dialogValues.className,
      teachingPlace: dialogValues.teachingPlace,
      lessonTopicsCovered: dialogValues.lessonTopicsCovered,
      teachingMethodsUsed: dialogValues.teachingMethodsUsed,
      createdAt: editingReport?.createdAt || now,
      points: editingReport?.points || 0,
    };

    try {
      if (editingReport) {
        await updateDoc(doc(db, 'teacherProgress', editingReport.id), payload);
      } else {
        await addDoc(collection(db, 'teacherProgress'), payload);
      }
      setShowDialog(false);
      setEditingReport(null);
    } catch (err) {
      setError(err.message || 'Failed to save report.');
    }
  };

  const canModifyReport = (report) => {
    const isOwner = report.teacherUid === currentUserUid;
    return isAdmin || (isOwner && isSunday);
  };

  const handleDelete = async (report) => {
    if (!canModifyReport(report)) {
      window.alert('Deleting is only allowed on Sundays for your own reports.');
      return;
    }
    setDeleteDialogReport(report);
  };

  const confirmDelete = async () => {
    if (!deleteDialogReport) return;
    try {
      await deleteDoc(doc(db, 'teacherProgress', deleteDialogReport.id));
      setDeleteDialogReport(null);
    } catch (err) {
      setError(err.message || 'Failed to delete report.');
    }
  };

  const handleSetPoints = (report) => {
    if (!isAdmin) {
      window.alert('Only admin can award points.');
      return;
    }
    setPointsDialogReport(report);
    setPointsInput(String(report.points || 0));
  };

  const confirmPoints = async () => {
    if (!pointsDialogReport) return;
    const value = parseInt(pointsInput, 10) || 0;
    try {
      await updateDoc(doc(db, 'teacherProgress', pointsDialogReport.id), { points: value });
      setPointsDialogReport(null);
    } catch (err) {
      setError(err.message || 'Failed to update points.');
    }
  };

  const filteredReports = useMemo(() => reports, [reports]);

  const formatDateTime = (createdAt) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    return date.toLocaleString();
  };

  return (
    <Box className="page-shell page-glow-background" sx={{ minHeight: '100vh', py: 3 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Typography variant="h5" fontWeight="bold">
              Teacher Progress Reports
            </Typography>
          </Box>
          {!isAdmin && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: isSunday ? 'success.light' : 'error.light',
                color: isSunday ? 'success.contrastText' : 'error.contrastText',
              }}
            >
              <CalendarIcon fontSize="small" />
              <Typography variant="body2" fontWeight="bold">
                {isSunday ? 'Submissions Open (Sunday)' : 'Submissions Closed (Sunday Only)'}
              </Typography>
            </Box>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              type="date"
              size="small"
              label="Filter by date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            {selectedDate && (
              <Button onClick={() => setSelectedDate('')}>
                Clear
              </Button>
            )}
            <Box flexGrow={1} />
            <Button variant="contained" onClick={handleOpenNew}>
              Add Report
            </Button>
          </Stack>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : filteredReports.length === 0 ? (
          <Typography color="text.secondary">No reports found.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {filteredReports.map((report) => (
              <Card key={report.id} variant="outlined">
                <CardContent sx={{ py: '12px !important' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box>
                      <Typography fontWeight="bold">{report.teacherName || 'Teacher'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class: {report.className || '-'} • Place: {report.teachingPlace || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(report.createdAt)}
                      </Typography>
                    </Box>
                    <Box>
                      {report.points ? (
                        <Chip
                          icon={<PointsIcon />}
                          label={`${report.points} pts`}
                          color="primary"
                          size="small"
                        />
                      ) : null}
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Lesson Topics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {report.lessonTopicsCovered || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Teaching Methods
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {report.teachingMethodsUsed || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {isAdmin && (
                      <IconButton size="small" onClick={() => handleSetPoints(report)}>
                        <PointsIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleOpenEdit(report)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(report)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingReport ? 'Edit Progress Report' : 'Add Progress Report'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Teacher Name"
                value={dialogValues.teacherName}
                onChange={(e) =>
                  setDialogValues((prev) => ({ ...prev, teacherName: e.target.value }))
                }
                fullWidth
                disabled={!isAdmin && !!currentUserName}
              />
              <TextField
                label="Class / Group"
                value={dialogValues.className}
                onChange={(e) =>
                  setDialogValues((prev) => ({ ...prev, className: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Teaching Place"
                value={dialogValues.teachingPlace}
                onChange={(e) =>
                  setDialogValues((prev) => ({ ...prev, teachingPlace: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Lesson Topics Covered"
                value={dialogValues.lessonTopicsCovered}
                onChange={(e) =>
                  setDialogValues((prev) => ({ ...prev, lessonTopicsCovered: e.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Teaching Methods Used"
                value={dialogValues.teachingMethodsUsed}
                onChange={(e) =>
                  setDialogValues((prev) => ({ ...prev, teachingMethodsUsed: e.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveDialog} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Points Dialog */}
        <Dialog open={!!pointsDialogReport} onClose={() => setPointsDialogReport(null)}>
          <DialogTitle>
            Award Points {pointsDialogReport ? `to ${pointsDialogReport.teacherName}` : ''}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Points"
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              fullWidth
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPointsDialogReport(null)}>Cancel</Button>
            <Button variant="contained" onClick={confirmPoints}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialogReport} onClose={() => setDeleteDialogReport(null)}>
          <DialogTitle>Delete Report</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the report by{' '}
              <strong>{deleteDialogReport?.teacherName}</strong>? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogReport(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TeacherAttendancePage;

