import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Avatar, Box, Button, Chip, Container, Grid, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { ArrowBack, EditOutlined } from '@mui/icons-material';
import { collection, onSnapshot } from '../../../services/studentData';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useActivityPeriod } from '../../../contexts/ActivityPeriodContext';
import SchoolLoader from '../../../components/SchoolLoader';
import SchoolArtwork from '../../../components/SchoolArtwork';
import { activityDate, activityDay, belongsToTeacher, isActivityAdmin, newestActivity, sundayActivity, teacherAttendanceDays, teacherRewards } from '../../../utils/teacherActivity';

const sources = { teachers: 'Teachers', students: 'Student rewards and attendance', teacherProgress: 'Progress reports', teacher_reports: 'Older reports', homeworks: 'Homework', offerings: 'Offerings', financial_records: 'Older offerings' };
const sections = ['overview', 'rewards', 'reports', 'homework', 'attendance', 'offerings'];
const money = amount => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const when = value => activityDate(value)?.toLocaleString('en-IN', { dateStyle: 'medium', ...(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? {} : { timeStyle: 'short' }) }) || 'Date not recorded';
const Empty = ({ children }) => <Paper sx={{ p: 4, textAlign: 'center' }}><SchoolArtwork name="clipboard" style={{ display: 'inline-block', width: 50 }} /><Typography sx={{ mt: 1 }} color="text.secondary">{children}</Typography></Paper>;

export default function TeacherActivityPage() {
  const { currentUser } = useAuth();
  const { teacherId } = useParams();
  const { period } = useActivityPeriod();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const admin = isActivityAdmin(currentUser);
  const target = teacherId || currentUser?.uid;
  const allowed = !!target && (admin || (currentUser?.role === 'TEACHER' && target === currentUser.uid));
  const tab = sections.includes(params.get('section')) ? params.get('section') : 'overview';
  const [retry, setRetry] = useState(0);
  const [feeds, setFeeds] = useState({});
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('month') || '') ? params.get('month') : activityDay(new Date()).slice(0, 7);
  const [search, setSearch] = useState('');
  useEffect(() => {
    setFeeds({});
    if (!allowed) return;
    // Filters and tabs use the existing snapshots instead of fetching again.
    const stops = Object.keys(sources).map(source => onSnapshot(collection(db, source), snapshot => {
      setFeeds(previous => ({ ...previous, [source]: { target, rows: snapshot.docs.map(item => ({ ...item.data(), id: item.id, ...(source === 'teachers' ? { uid: item.id } : {}) })), status: 'ready' } }));
    }, () => setFeeds(previous => ({ ...previous, [source]: { target, rows: [], status: 'error' } }))));
    return () => stops.forEach(stop => stop());
  }, [target, allowed, period, retry]);
  const rows = source => feeds[source]?.target === target ? feeds[source].rows : [];
  const teachers = rows('teachers');
  const teacher = teachers.find(item => item.uid === target);
  const students = rows('students');
  const rewards = useMemo(() => teacherRewards(students, teacher, teachers), [students, teacher, teachers]);
  const reports = [...rows('teacherProgress').map(row => ({ ...row, id: `progress:${row.id}` })), ...rows('teacher_reports').map(row => ({ ...row, id: `report:${row.id}` }))].filter(row => belongsToTeacher(row, teacher, teachers)).sort(newestActivity);
  const homework = rows('homeworks').filter(row => belongsToTeacher(row, teacher, teachers)).sort(newestActivity);
  const offerings = [...rows('offerings').map(row => ({ ...row, id: `offering:${row.id}` })), ...rows('financial_records').filter(row => row.type === 'offering').map(row => ({ ...row, id: `legacy:${row.id}` }))].filter(row => belongsToTeacher(row, teacher, teachers)).sort(newestActivity);
  const marked = teacherAttendanceDays(students, teacher, teachers);
  const sundays = sundayActivity(month, marked);
  const pending = source => !feeds[source] || feeds[source].target !== target;
  const failed = Object.keys(sources).filter(source => feeds[source]?.target === target && feeds[source].status === 'error');
  const complete = keys => ['teachers', ...keys].every(source => feeds[source]?.target === target && feeds[source].status === 'ready');
  const totalReward = rewards.reduce((sum, item) => sum + item.amount, 0);
  const childTotals = [...rewards.reduce((map, item) => { const previous = map.get(item.studentKey) || { name: item.studentName, studentId: item.studentId, amount: 0, count: 0 }; map.set(item.studentKey, { ...previous, amount: previous.amount + item.amount, count: previous.count + 1 }); return map; }, new Map()).entries()];
  const stats = [
    ['Reward dollars given', `$${money(totalReward)}`, ['students']],
    ['Children rewarded', childTotals.length, ['students']],
    ['Progress reports', reports.length, ['teacherProgress', 'teacher_reports']],
    ['Homework assigned', homework.length, ['homeworks']],
    ['Sundays with saved marking', marked.size, ['students']],
    ['Offerings entered', `₹${money(offerings.reduce((sum, row) => sum + (Number(row.amount) || 0), 0))}`, ['offerings', 'financial_records']],
  ];
  const sectionSources = { overview: [], rewards: ['students'], reports: ['teacherProgress', 'teacher_reports'], homework: ['homeworks'], attendance: ['students'], offerings: ['offerings', 'financial_records'] };
  const sectionPending = sectionSources[tab].some(pending);
  const back = () => navigate(teacherId ? '/teacher/teacher-progress' : '/teacher/dashboard?tab=3');
  if (!allowed) return <Container sx={{ py: 4 }}><Alert severity="error">You can only view your own teacher activity.</Alert><Button onClick={() => navigate('/')}>Back to home</Button></Container>;
  return <Box className="admin-page teacher-activity-page" sx={{ minHeight: '100vh', py: 3 }}><Container maxWidth="lg">
    <Button startIcon={<ArrowBack />} onClick={back} sx={{ mb: 2 }}>{teacherId ? 'Teachers list' : 'Dashboard'}</Button>
    {failed.length > 0 && <Alert severity="warning" sx={{ mt: 3 }} action={<Button color="inherit" onClick={() => setRetry(value => value + 1)}>Retry</Button>}>Unable to load: {failed.map(source => sources[source]).join(', ')}. Activity shown may be incomplete.</Alert>}
    {pending('teachers') ? <SchoolLoader message="Opening the teacher profile" /> : !teacher ? <Alert severity="error">{failed.includes('teachers') ? 'The teacher profile could not be loaded. Retry below.' : 'This teacher profile was not found.'}</Alert> : <>
      <Paper className="teacher-activity-header" sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Avatar src={teacher.profileImageUrl} sx={{ width: 64, height: 64, bgcolor: '#7441cf' }}>{(teacher.name || 'T')[0]}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography component="h1" variant="h4" fontWeight={900}>{teacher.name || 'Teacher'}</Typography><Typography color="text.secondary">Teacher profile & activity</Typography><Typography variant="body2" sx={{ overflowWrap: 'anywhere', mt: .5 }}>{teacher.email || 'Email not recorded'}{teacher.phone ? ` · ${teacher.phone}` : ''}</Typography></Box>
        {target === currentUser.uid && !admin && <Button startIcon={<EditOutlined />} onClick={() => navigate('/teacher/profile/edit')}>Edit details</Button>}
      </Paper>
      {period && <Alert severity="info" sx={{ mb: 2 }}>Rewards and student attendance use the current school data period. Submitted reports, homework, offerings and saved Sunday sessions retain their history.</Alert>}
      <Paper sx={{ mb: 3, px: 1 }}><Tabs value={tab} onChange={(_, value) => setParams(previous => { const next = new URLSearchParams(previous); next.set('section', value); return next; })} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Teacher activity sections">{sections.map(section => <Tab key={section} value={section} label={section[0].toUpperCase() + section.slice(1)} />)}</Tabs></Paper>
      {sectionPending && <SchoolLoader message={`Gathering ${tab} activity`} />}
      {!sectionPending && tab === 'overview' && <><Grid container spacing={2}>{stats.map(([label, value, keys]) => <Grid item xs={6} md={4} key={label}><Paper className="teacher-activity-stat" sx={{ p: 2, height: '100%' }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>{complete(keys) ? value : keys.some(pending) ? 'Preparing…' : 'Unavailable'}</Typography></Paper></Grid>)}</Grid><Paper sx={{ p: 3, mt: 3 }}><Typography variant="h6" fontWeight={800}>Every saved activity in one place</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Open Rewards for each child and reason, Reports for lesson progress, Homework for assignments, Attendance for Sunday dates, or Offerings for the amount, place and time.</Typography></Paper></>}
      {!sectionPending && tab === 'rewards' && <Stack spacing={2}>
        <TextField label="Search child name or student ID" value={search} onChange={event => setSearch(event.target.value)} fullWidth />
        <Typography variant="h6" fontWeight={800}>Dollars by child</Typography>
        {childTotals.filter(([id, child]) => `${child.studentId} ${child.name}`.toLowerCase().includes(search.toLowerCase())).map(([id, child]) => <Paper key={id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}><Box><Typography fontWeight={800}>{child.name}</Typography><Typography variant="body2" color="text.secondary">{child.studentId} · {child.count} reward{child.count === 1 ? '' : 's'}</Typography></Box><Chip color="success" label={`$${money(child.amount)}`} /></Paper>)}
        <Typography variant="h6" fontWeight={800}>Every reward & reason</Typography>
        {rewards.filter(row => `${row.studentName} ${row.studentId}`.toLowerCase().includes(search.toLowerCase())).map(row => <Paper key={row.id} sx={{ p: 2 }}><Stack direction="row" justifyContent="space-between" spacing={2}><Typography fontWeight={800}>{row.studentName}</Typography><Chip color="success" label={`$${money(row.amount)}`} /></Stack><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{row.reason || 'Reason not recorded'}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{when(row.dateValue)}</Typography></Paper>)}
        {!rewards.length && <Empty>{complete(['students']) ? 'No rewards recorded for this teacher.' : 'Reward data is unavailable. Use Retry above.'}</Empty>}
      </Stack>}
      {!sectionPending && tab === 'reports' && <Stack spacing={2}>{reports.map(row => <Paper key={row.id} sx={{ p: 3 }}><Typography variant="h6" fontWeight={800}>{row.className || row.title || 'Progress report'}</Typography><Typography variant="body2" color="text.secondary">{row.teachingPlace || row.place || 'Place not recorded'} · {when(row.createdAt || row.date)}</Typography><Typography fontWeight={800} sx={{ mt: 2 }}>Lesson topics</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{row.lessonTopicsCovered || row.description || 'Not recorded'}</Typography><Typography fontWeight={800} sx={{ mt: 2 }}>Teaching methods</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{row.teachingMethodsUsed || 'Not recorded'}</Typography><Chip sx={{ mt: 2 }} label={`${Number(row.points) || 0} report points`} /></Paper>)}{!reports.length && <Empty>{complete(['teacherProgress', 'teacher_reports']) ? 'No progress reports recorded for this teacher.' : 'Report data is unavailable. Use Retry above.'}</Empty>}</Stack>}
      {!sectionPending && tab === 'homework' && <Stack spacing={2}>{homework.map(row => <Paper key={row.id} sx={{ p: 3 }}><Typography variant="h6" fontWeight={800}>{row.title || 'Homework'}</Typography><Typography color="text.secondary">{[row.subject, row.classType, row.place].filter(Boolean).join(' · ')}</Typography><Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{row.description || 'No description recorded'}</Typography><Typography variant="body2" sx={{ mt: 2 }}>Assigned: {when(row.createdAt)} · Due: {when(row.dueDate)}</Typography></Paper>)}{!homework.length && <Empty>{complete(['homeworks']) ? 'No homework assigned by this teacher.' : 'Homework data is unavailable. Use Retry above.'}</Empty>}</Stack>}
      {!sectionPending && complete(['students']) && tab === 'attendance' && <Stack spacing={2}><TextField type="month" label="Sunday attendance month" value={month} onChange={event => setParams(previous => { const next = new URLSearchParams(previous); next.set('month', event.target.value); return next; })} InputLabelProps={{ shrink: true }} /><Alert severity="info">Yes means this teacher saved attendance on that Sunday. No means no saved marking could be attributed to this teacher. Future Sundays are excluded.</Alert>{sundays.map(row => <Paper key={row.date} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography fontWeight={800}>{when(row.date)}</Typography><Chip color={row.marked ? 'success' : 'default'} label={`Marked: ${row.marked ? 'Yes' : 'No'}`} /></Paper>)}{!sundays.length && <Empty>No past Sundays in this month.</Empty>}</Stack>}
      {!sectionPending && tab === 'offerings' && <Stack spacing={2}>{offerings.map(row => <Paper key={row.id} className="teacher-offering-entry" sx={{ p: 3 }}><Stack direction="row" justifyContent="space-between" spacing={2}><Typography variant="h6" fontWeight={800}>{row.place || row.location || 'Place not recorded'}</Typography><Typography variant="h6" color="success.main" fontWeight={900}>₹{money(row.amount)}</Typography></Stack><Typography sx={{ mt: 1 }}>{row.reason || 'Offering'}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{when(row.timestamp || row.createdAt || row.date)}</Typography></Paper>)}{!offerings.length && <Empty>{complete(['offerings', 'financial_records']) ? 'No offerings entered by this teacher.' : 'Offering data is unavailable. Use Retry above.'}</Empty>}</Stack>}
      {['rewards', 'attendance', 'offerings', 'reports'].includes(tab) && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>Older entries without an account ID are included only when the saved teacher name uniquely matches this profile. Unidentified entries are not assigned to a teacher.</Typography>}
    </>}
  </Container></Box>;
}
