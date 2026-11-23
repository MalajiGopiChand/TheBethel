import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, ButtonBase, Stack, Avatar, Chip, Dialog, DialogTitle, DialogContent, IconButton, CircularProgress, Alert, ToggleButtonGroup, ToggleButton, LinearProgress } from '@mui/material';
import { ArrowForwardRounded, CloseRounded, LocalFireDepartmentRounded, AccountBalanceWalletRounded, CalendarMonthRounded, CheckRounded, ChatBubbleOutlineRounded, SchoolOutlined } from '@mui/icons-material';
import { collection, query, orderBy, limit, onSnapshot } from '../../../services/notifyingFirestore';
import { db } from '../../../config/firebase';
import { activityDate, parentAttendance, parentRewards } from '../../../utils/parentActivity';

function AnimatedNumber({ value }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let frame; const start = performance.now();
    const tick = now => { const progress = Math.min((now - start) / 650, 1); setShown(Math.round(value * (1 - (1 - progress) ** 3))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="parent-number" aria-label={String(value)}><span aria-hidden="true">{shown.toLocaleString()}</span></span>;
}
const surface = { p: 2.5, borderRadius: 4, border: '1px solid #e2ebe5', bgcolor: '#fff' };
export default function HomeTab({ student, parentLang = 'te' }) {
  const navigate = useNavigate();
  const te = parentLang === 'te', text = (en, tel) => te ? tel : en;
  const [detail, setDetail] = useState(null), [filter, setFilter] = useState('all');
  const [announcements, setAnnouncements] = useState([]), [announcementError, setAnnouncementError] = useState(false);
  const dateLabel = value => activityDate(value)?.toLocaleDateString(te ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || text('Date unavailable', 'తేదీ అందుబాటులో లేదు');
  useEffect(() => onSnapshot(query(collection(db, 'notifications'), orderBy('date', 'desc'), limit(30)), snapshot => {
    setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(note => ['Parents', 'All Students', 'All'].includes(note.audience || 'All')).slice(0, 4));
    setAnnouncementError(false);
  }, () => setAnnouncementError(true)), []);
  if (!student) return <Alert severity="info">{text('No student is linked to this account. Please contact your school administrator.', 'ఈ ఖాతాకు విద్యార్థి వివరాలు లేవు. నిర్వాహకుడిని సంప్రదించండి.')}</Alert>;
  const records = parentAttendance(student), rewards = parentRewards(student);
  const present = records.filter(item => item.status === 'present').length;
  const percent = records.length ? Math.round(present / records.length * 100) : 0;
  const dollars = Number(student.dollarPoints) || 0, streak = Math.max(0, Number(student.currentStreak) || 0);
  const showDetail = value => { setFilter('all'); setDetail(value); };
  const title = detail === 'dollars' ? text('Dollar history', 'డాలర్ల చరిత్ర') : detail === 'streak' ? text('Current streak', 'ప్రస్తుత వరుస హాజరు') : text('Attendance history', 'హాజరు చరిత్ర');
  const rewardRow = (reward, i) => <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ py: 2, borderBottom: '1px solid #edf1ef' }}>
    <Avatar sx={{ bgcolor: '#fff4d9', color: '#92651a', borderRadius: 3 }}><AccountBalanceWalletRounded fontSize="small" /></Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{reward.reason || text('Dollar reward', 'డాలర్ల బహుమతి')}</Typography><Typography variant="caption" color="text.secondary">{dateLabel(reward.date)}{(reward.teacher || reward.awardedBy) ? ` · ${reward.teacher || reward.awardedBy}` : ''}</Typography></Box>
    <Typography fontWeight={800} sx={{ color: Number(reward.dollars) < 0 ? '#b34040' : '#17695e', whiteSpace: 'nowrap' }}>{Number(reward.dollars) >= 0 ? '+' : '−'}{Math.abs(Number(reward.dollars) || 0)} $</Typography>
  </Stack>;
  const filteredRecords = records.filter(item => filter === 'all' || item.status === filter);
  return <Box className="parent-enter">
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 5, color: '#fff', background: 'linear-gradient(115deg, #164f46, #23796a)', position: 'relative', overflow: 'hidden', mb: 3 }}>
      <SchoolOutlined aria-hidden sx={{ position: 'absolute', right: -12, bottom: -30, fontSize: 190, opacity: .08, transform: 'rotate(-12deg)' }} />
      <Typography variant="overline" sx={{ letterSpacing: 2, color: '#c2e8d6' }}>{text('A LITTLE PROGRESS, EVERY SUNDAY', 'ప్రతి ఆదివారం ఒక ముందడుగు')}</Typography>
      <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 38 }, fontWeight: 800, letterSpacing: '-.04em', mt: 1, overflowWrap: 'anywhere' }}>{student.name}</Typography>
      <Typography sx={{ color: '#dbede7', mt: 1 }}>{text('Growing in faith. Celebrating every step.', 'విశ్వాసంలో ఎదుగుతూ, ప్రతి అడుగును ఆనందిద్దాం.')}</Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2.5 }}>{[student.classType, student.place || student.location, dateLabel(new Date())].filter(Boolean).map((label, i) => <Chip key={i} label={label} size="small" sx={{ color: '#fff', bgcolor: '#ffffff18', border: '1px solid #ffffff30' }} />)}</Stack>
    </Paper>
    <Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{text('Your child at a glance', 'మీ పిల్లవాడి పురోగతి')}</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1.1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
      <ButtonBase className="parent-stat" onClick={() => showDetail('attendance')} sx={{ ...surface, gridColumn: { xs: '1 / -1', md: 'auto' }, display: 'flex', justifyContent: 'space-between', gap: 2, textAlign: 'left' }}>
        <Box><CalendarMonthRounded sx={{ color: '#23796a', mb: 1 }} /><Typography fontWeight={700}>{text('Attendance', 'హాజరు')}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{present} {text('present', 'హాజరు')} · {records.length - present} {text('absent', 'గైర్హాజరు')}</Typography><Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>{text('View attendance', 'హాజరు చూడండి')} <ArrowForwardRounded sx={{ fontSize: 16 }} /></Typography></Box>
        <Box className="parent-progress" sx={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}><CircularProgress variant="determinate" value={100} size={88} thickness={4} sx={{ color: '#edf3ef', position: 'absolute' }} /><CircularProgress variant="determinate" value={percent} size={88} thickness={4} sx={{ color: '#23796a' }} /><Typography sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 23, fontWeight: 800 }}>{percent}%</Typography></Box>
      </ButtonBase>
      {[
        { id: 'dollars', title: text('Dollar balance', 'డాలర్ల మొత్తం'), value: dollars, Icon: AccountBalanceWalletRounded, bg: '#fff6df', color: '#805917', subtitle: text('View reward history', 'బహుమతుల చరిత్ర') },
        { id: 'streak', title: text('Current streak', 'వరుస హాజరు'), value: streak, Icon: LocalFireDepartmentRounded, bg: '#ffefe8', color: '#a14a2c', subtitle: text('Consecutive Sundays', 'వరుస ఆదివారాలు') },
      ].map(({ id, title, value, Icon, bg, color, subtitle }) => <ButtonBase key={id} className="parent-stat" onClick={() => showDetail(id)} sx={{ display: 'block', textAlign: 'left', p: { xs: 2, sm: 2.5 }, borderRadius: 4, bgcolor: bg, color, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between"><Icon /><ArrowForwardRounded sx={{ fontSize: 18, opacity: .7 }} /></Stack><Typography sx={{ fontSize: { xs: 36, sm: 44 }, fontWeight: 800, my: .8 }}><AnimatedNumber value={value} /></Typography><Typography fontWeight={700}>{title}</Typography><Typography variant="caption">{subtitle}</Typography>
      </ButtonBase>)}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 3 }}>
      <Paper elevation={0} sx={surface}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography component="h2" variant="h6" fontWeight={800}>{text('Recent rewards', 'ఇటీవలి బహుమతులు')}</Typography><Button onClick={() => showDetail('dollars')} size="small">{text('View all', 'అన్నీ చూడండి')}</Button></Stack>{rewards.length ? rewards.slice(0, 3).map(rewardRow) : <Box sx={{ py: 4 }}><Typography fontWeight={700}>{text('A fresh start', 'కొత్త ప్రారంభం')}</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>{text('Your child’s rewards will appear here as they are earned.', 'మీ పిల్లవాడు పొందిన బహుమతులు ఇక్కడ కనిపిస్తాయి.')}</Typography></Box>}</Paper>
      <Paper elevation={0} sx={{ ...surface, bgcolor: '#eaf2ed', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}><ChatBubbleOutlineRounded sx={{ color: '#23796a', mb: 1.5 }} /><Typography component="h2" variant="h6" fontWeight={800}>{text('We’re here to help', 'మీకు సహాయం చేయడానికి')}</Typography><Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>{text('Share a concern with the school and track its response.', 'మీ సమస్యను పాఠశాలకు తెలియజేసి, సమాధానాన్ని చూడండి.')}</Typography><Button variant="outlined" endIcon={<ArrowForwardRounded />} onClick={() => navigate('/parent/complaints')}>{text('Contact the school', 'పాఠశాలను సంప్రదించండి')}</Button></Paper>
    </Box>
    <Typography component="h2" variant="h6" fontWeight={800} sx={{ mt: 3.5, mb: 1.5 }}>{text('From your school', 'పాఠశాల సమాచారం')}</Typography>
    {announcementError ? <Alert severity="info">{text('School updates could not load. Please try again later.', 'సమాచారం లోడ్ కాలేదు. మళ్లీ ప్రయత్నించండి.')}</Alert> : announcements.length ? announcements.map(note => <Paper key={note.id} elevation={0} sx={{ ...surface, mb: 1.5 }}><Typography variant="caption" color="text.secondary">{dateLabel(note.date || note.createdAt)}</Typography><Typography fontWeight={800} sx={{ mt: .5 }}>{note.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{note.message}</Typography></Paper>) : <Paper elevation={0} sx={{ ...surface, borderStyle: 'dashed' }}><Typography color="text.secondary">{text('You’re all caught up. New school updates will appear here.', 'కొత్త పాఠశాల సమాచారం ఇక్కడ కనిపిస్తుంది.')}</Typography></Paper>}
    <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth PaperProps={{ className: 'parent-detail', sx: { borderRadius: 4, m: 2, width: 'calc(100% - 32px)', maxHeight: '85dvh' } }} aria-labelledby="parent-detail-title">
      <DialogTitle id="parent-detail-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800 }}>{title}<IconButton aria-label={text('Close details', 'మూసివేయండి')} onClick={() => setDetail(null)}><CloseRounded /></IconButton></DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Box className="parent-enter" sx={{ p: 3, borderRadius: 3, bgcolor: detail === 'dollars' ? '#fff6df' : '#eaf2ed', mb: 2 }}><Typography variant="body2" color="text.secondary">{student.name}</Typography><Typography sx={{ fontSize: 44, fontWeight: 800, color: '#183f35' }}><AnimatedNumber value={detail === 'dollars' ? dollars : detail === 'streak' ? streak : percent} />{detail === 'attendance' ? '%' : ''}</Typography><Typography fontWeight={600}>{detail === 'dollars' ? text('Total dollar balance', 'మొత్తం డాలర్లు') : detail === 'streak' ? text('Consecutive Sundays attended', 'వరుసగా హాజరైన ఆదివారాలు') : text('Of recorded sessions attended', 'నమోదైన తరగతుల్లో హాజరు')}</Typography>
          {detail === 'streak' && <><LinearProgress variant="determinate" value={streak % 4 * 25} sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: '#d4e5d9' }} /><Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{text(`Next milestone: ${Math.floor(streak / 4) * 4 + 4} Sundays. Keep showing up!`, `తదుపరి లక్ష్యం: ${Math.floor(streak / 4) * 4 + 4} ఆదివారాలు.`)}</Typography></>}
        </Box>
        {detail === 'dollars' ? (rewards.length ? rewards.map(rewardRow) : <Typography sx={{ p: 2 }} color="text.secondary">{text('No rewards recorded yet.', 'ఇంకా బహుమతులు నమోదు కాలేదు.')}</Typography>) : <>
          <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, value) => value && setFilter(value)} aria-label={text('Filter attendance', 'హాజరు వడపోత')} sx={{ mb: 2, display: 'flex', '& button': { flex: 1, textTransform: 'none' } }}><ToggleButton value="all">{text('All', 'అన్నీ')}</ToggleButton><ToggleButton value="present">{text('Present', 'హాజరు')}</ToggleButton><ToggleButton value="absent">{text('Absent', 'గైర్హాజరు')}</ToggleButton></ToggleButtonGroup>
          {filteredRecords.length ? filteredRecords.map(record => <Stack key={record.date} direction="row" alignItems="center" gap={1.5} sx={{ py: 1.5, borderBottom: '1px solid #edf1ef' }}><Avatar sx={{ bgcolor: record.status === 'present' ? '#eaf2ed' : '#fff0ec', color: record.status === 'present' ? '#23796a' : '#ad4f36', width: 36, height: 36 }}>{record.status === 'present' ? <CheckRounded fontSize="small" /> : <CloseRounded fontSize="small" />}</Avatar><Typography sx={{ flex: 1 }} fontWeight={600}>{dateLabel(record.date)}</Typography><Chip size="small" label={record.status === 'present' ? text('Present', 'హాజరు') : text('Absent', 'గైర్హాజరు')} sx={{ bgcolor: record.status === 'present' ? '#eaf2ed' : '#fff0ec', color: record.status === 'present' ? '#23796a' : '#ad4f36' }} /></Stack>) : <Typography sx={{ p: 2 }} color="text.secondary">{text('No attendance records in this view yet.', 'ఈ విభాగంలో ఇంకా హాజరు వివరాలు లేవు.')}</Typography>}
        </>}
      </DialogContent>
    </Dialog>
  </Box>;
}
