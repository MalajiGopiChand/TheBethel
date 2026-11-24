import SchoolLoader from '../../../components/SchoolLoader';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  MenuItem,
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
} from "../../../services/notifyingFirestore";
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { activityDate, activityDay, belongsToTeacher, isActivityAdmin, newestActivity } from '../../../utils/teacherActivity';

const ADMIN_EMAILS = ['gop1@gmail.com', 'premkumartenali@gmail.com', 'admin@gmail.com'];

const TeacherAttendancePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [saving, setSaving] = useState(false);

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

  const isAdmin = isActivityAdmin(currentUser);

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

    const q = collection(db, 'teacherProgress');

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
  }, []);

  useEffect(() => onSnapshot(collection(db, 'teachers'), snapshot => {
    setTeachers(snapshot.docs.map(item => ({ ...item.data(), uid: item.id })).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
  }, () => setError('Unable to load teacher accounts. Retry the page before submitting a report.')), []);

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
    setSelectedTeacher(isAdmin ? '' : currentUserUid);
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
    setSelectedTeacher(report.teacherUid || '');
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
    if (saving || !isModificationAllowed || (!isAdmin && editingReport && editingReport.teacherUid !== currentUserUid)) return;
    const owner = teachers.find(teacher => teacher.uid === selectedTeacher);
    if (!editingReport && isAdmin && !owner) { setError('Select a teacher account for this report.'); return; }
    if (!dialogValues.className.trim() || !dialogValues.lessonTopicsCovered.trim()) { setError('Enter a class and the lesson topics covered.'); return; }
    const now = Date.now();
    const payload = {
      teacherName: editingReport ? (editingReport.teacherName || owner?.name || 'Teacher') : (isAdmin ? owner.name : currentUserName) || 'Teacher',
      ...(!editingReport ? { teacherUid: isAdmin ? owner.uid : currentUserUid } : {}),
      className: dialogValues.className,
      teachingPlace: dialogValues.teachingPlace,
      lessonTopicsCovered: dialogValues.lessonTopicsCovered,
      teachingMethodsUsed: dialogValues.teachingMethodsUsed,
      createdAt: editingReport?.createdAt || now,
      points: editingReport?.points || 0,
      updatedAt: now,
    };

    try {
      setSaving(true); setError('');
      if (editingReport) {
        await updateDoc(doc(db, 'teacherProgress', editingReport.id), payload);
      } else {
        await addDoc(collection(db, 'teacherProgress'), payload);
      }
      setShowDialog(false);
      setEditingReport(null);
    } catch (err) {
      setError(err.message || 'Failed to save report.');
    } finally { setSaving(false); }
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

  const filteredReports = useMemo(() => reports.filter(report => (isAdmin || belongsToTeacher(report, { ...currentUser, uid: currentUserUid }, teachers)) && (!selectedDate || activityDay(report.createdAt) === selectedDate)).sort(newestActivity), [reports, teachers, currentUser, isAdmin, currentUserUid, selectedDate]);

  const formatDateTime = (createdAt) => {
    if (!createdAt) return '';
    return activityDate(createdAt)?.toLocaleString('en-IN') || 'Date not recorded';
  };

  return (
    <Box className="page-shell page-glow-background" sx={{ minHeight: '100vh', py: 3 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button startIcon={<BackIcon />} onClick={handleBack}>
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
            <SchoolLoader />
          </Box>
        ) : filteredReports.length === 0 ? (
          <Typography color="text.secondary">No reports found.</Typography>
        ) : (
          <Stack spacing={2}>
            {filteredReports.map((report) => (
              <Card key={report.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box>
                      <Typography fontWeight="bold" variant="h6">{report.teacherName || 'Teacher'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class: {report.className || '-'} • Place: {report.teachingPlace || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
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
                  <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      Lesson Topics
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                      {report.lessonTopicsCovered || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1.5, bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="bold" color="secondary">
                      Teaching Methods
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                      {report.teachingMethodsUsed || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {isAdmin && (
                      <Button size="small" variant="outlined" startIcon={<PointsIcon />} onClick={() => handleSetPoints(report)}>
                        Points
                      </Button>
                    )}
                    {canModifyReport(report) && <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenEdit(report)}>
                      Edit
                    </Button>}
                    {isAdmin && <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(report)}>
                      Delete
                    </Button>}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onClose={() => !saving && setShowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingReport ? 'Edit Progress Report' : 'Add Progress Report'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {isAdmin && !editingReport && <TextField select label="Teacher account" value={selectedTeacher} onChange={event => { setSelectedTeacher(event.target.value); setDialogValues(previous => ({ ...previous, teacherName: teachers.find(teacher => teacher.uid === event.target.value)?.name || '' })); }} required fullWidth>{teachers.map(teacher => <MenuItem key={teacher.uid} value={teacher.uid}>{teacher.name || teacher.email} · {teacher.email}</MenuItem>)}</TextField>}
              <TextField
                label="Teacher Name"
                value={dialogValues.teacherName}
                onChange={(e) =>
                  setDialogValues((prev) => ({ ...prev, teacherName: e.target.value }))
                }
                fullWidth
                disabled
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
            <Button disabled={saving} onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button disabled={saving} onClick={handleSaveDialog} variant="contained">
              {saving ? 'Saving report…' : 'Save'}
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

