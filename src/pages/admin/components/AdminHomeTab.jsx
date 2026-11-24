import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, Paper, Skeleton, Typography } from '@mui/material';
import { CampaignRounded, VerifiedUserRounded, WhatsApp, CalendarTodayRounded, AttachMoneyRounded, FeedbackRounded, PeopleRounded, BarChartRounded, TollRounded, EmojiEventsOutlined } from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot } from '../../../services/studentData';
import { db } from '../../../config/firebase';
import { getDashboardAttendanceStats } from '../../../utils/dashboardAttendance';
import { rewardBalance } from '../../../utils/rewards';
import ActionGrid from '../../../components/ActionGrid';

export default function AdminHomeTab() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setError(''); setLoading(true);
    return onSnapshot(query(collection(db, 'students'), orderBy('studentId')), snapshot => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => { setError('Could not load the dashboard. Check your connection and try again.'); setLoading(false); });
  }, [retry]);
  const overview = useMemo(() => {
    const ranked = students.map(student => ({ ...student, dollars: rewardBalance(student) })).sort((a, b) => b.dollars - a.dollars);
    return { ...getDashboardAttendanceStats(students), totalStudents: students.length, totalDollars: ranked.reduce((sum, student) => sum + student.dollars, 0), top: ranked.slice(0, 3) };
  }, [students]);
  const actions = [
    ['Broadcast', 'Send announcements', <CampaignRounded />, '#A18CD1', '#e9dcff', '/admin/notifications'],
    ['Complaints', 'Parent issues', <FeedbackRounded />, '#7F7FD5', '#dce6ff', '/admin/complaints'],
    ['Verify Teachers', 'Manage approvals', <VerifiedUserRounded />, '#419be9', '#d4f0ff', '/admin/verify-teachers'],
    ['Live Chat', 'Staff conversation', <WhatsApp />, '#4bae73', '#dff4e8', '/teacher/messaging'],
    ['Timetable', 'Sunday schedules', <CalendarTodayRounded />, '#d0785c', '#ffecd5', '/admin/timetable'],
    ['Give Dollars', 'Student rewards', <AttachMoneyRounded />, '#dc726e', '#ffdddd', '/teacher/dollars-giving'],
  ].map(([title, subtitle, icon, colorStart, colorEnd, path]) => ({ title, subtitle, icon, colorStart, colorEnd, onClick: () => navigate(path) }));
  if (error) return <Alert severity="error" action={<Button onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{error}</Alert>;
  if (loading) return <Box aria-label="Loading dashboard"><Skeleton variant="rounded" height={140} sx={{ mb: 3 }} /><Skeleton variant="rounded" height={340} /></Box>;
  const podium = [overview.top[1], overview.top[0], overview.top[2]];
  return <section className="admin-home" aria-label="School overview">
    {overview.top.length > 0 ? <div className="admin-podium">
      {podium.map((student, index) => student && <Paper key={student.id} className="admin-podium-item" data-rank={[2, 1, 3][index]}>
        <div className="admin-podium-medal" aria-label={`Rank ${[2, 1, 3][index]}`}>{['🥈', '🥇', '🥉'][index]}</div>
        <Typography fontWeight={750} sx={{ fontSize: { xs: '.875rem', sm: '1.2rem' } }}>{student.name || 'Student'}</Typography>
        <Typography fontWeight={800} sx={{ mt: .5, fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>${student.dollars.toLocaleString()}</Typography>
      </Paper>)}
    </div> : <Alert severity="info" sx={{ mb: 3 }}>Add your first student to start tracking attendance and rewards.</Alert>}
    <div className="admin-quick-heading">
      <Typography component="h2" variant="h5">Quick Actions</Typography>
      <Button variant="outlined" startIcon={<EmojiEventsOutlined />} onClick={() => navigate('/teacher/leaderboard')}>View Full Leaderboard</Button>
    </div>
    <ActionGrid actions={actions} />
    <div className="admin-stats">
      {[
        ['Total Students', overview.totalStudents.toLocaleString(), <PeopleRounded />],
        ['Attendance Rate', `${overview.attendancePercentage}%`, <BarChartRounded />],
        ['Total Dollars Given', `$${overview.totalDollars.toLocaleString()}`, <TollRounded />],
      ].map(([label, value, icon]) => <Paper key={label} className="admin-stat"><div className="admin-stat-icon">{icon}</div><div><Typography color="text.secondary" sx={{ fontSize: '.875rem' }}>{label}</Typography><Typography sx={{ fontSize: { xs: '1.9rem', sm: '2.3rem' }, lineHeight: 1.25, fontWeight: 800 }}>{value}</Typography></div></Paper>)}
    </div>
    <div className="admin-attendance-line"><span>{overview.dateLabel || 'Sunday attendance'}</span><Chip size="small" color="success" variant="outlined" label={`${overview.todayPresentCount} Present`} /><Chip size="small" variant="outlined" label={`${overview.todayAbsentCount} Absent`} /><Button size="small" onClick={() => navigate('/teacher/attendance-summary')}>View summary</Button></div>
  </section>;
}
