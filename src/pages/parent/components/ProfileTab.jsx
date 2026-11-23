import React, { useState } from 'react';
import { Box, Typography, Paper, Avatar, Stack, Button, Alert, Divider } from '@mui/material';
import InstallButton from '../../../components/InstallButton';
import { registerPushTokenForUser } from '../../../services/notificationService';

export default function ProfileTab({ student, parentUser, parentLang = 'te' }) {
  const text = (en, te) => parentLang === 'te' ? te : en;
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  if (!student) return <Alert severity="info">{text('Student details are not available. Please contact your school.', 'విద్యార్థి వివరాలు లేవు. పాఠశాలను సంప్రదించండి.')}</Alert>;
  const group = (title, entries) => <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2ebe5' }}><Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>{title}</Typography><Box component="dl" sx={{ m: 0 }}>{entries.map(([label, value], i) => <Box key={label} sx={{ py: 1.5, borderTop: i ? '1px solid #edf1ef' : 0 }}><Typography component="dt" variant="caption" color="text.secondary">{label}</Typography><Typography component="dd" sx={{ m: 0, mt: .4, fontWeight: 600, overflowWrap: 'anywhere' }}>{value || text('Not provided', 'వివరాలు లేవు')}</Typography></Box>)}</Box></Paper>;
  const enableAlerts = async () => {
    setBusy(true); setMessage('');
    try { const token = await registerPushTokenForUser(parentUser, { requestPermission: true }); if (!token) throw new Error('Please sign in again and retry.'); setMessage(text('Device registered. Alerts are delivered when the school notification server is active.', 'పరికరం నమోదు అయింది. పాఠశాల నోటిఫికేషన్ సర్వర్ పనిచేసినప్పుడు సమాచారం అందుతుంది.')); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <Box className="parent-enter">
    <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 1 }}>{text('Your family profile', 'మీ కుటుంబ వివరాలు')}</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>{text('A little closer to your child’s school journey.', 'మీ పిల్లవాడి పాఠశాల ప్రయాణానికి మరింత చేరువగా.')}</Typography>
    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: '#eaf2ed' }}><Stack direction="row" alignItems="center" gap={2}><Avatar sx={{ width: 64, height: 64, bgcolor: '#17695e', fontSize: 26 }}>{student.name?.[0] || '?'}</Avatar><Box sx={{ minWidth: 0 }}><Typography variant="h5" fontWeight={800}>{student.name}</Typography><Typography color="text.secondary">{student.classType} · {student.place || student.location}</Typography></Box></Stack></Paper>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      {group(text('Student details', 'విద్యార్థి వివరాలు'), [[text('Student ID', 'విద్యార్థి సంఖ్య'), student.studentId], [text('Class', 'తరగతి'), student.classType], [text('School location', 'పాఠశాల ప్రాంతం'), student.place || student.location]])}
      {group(text('Family & contact', 'కుటుంబం & సంప్రదింపు'), [[text('Father', 'తండ్రి'), student.fatherName], [text('Mother', 'తల్లి'), student.motherName], [text('Email', 'ఇమెయిల్'), parentUser?.email], [text('Phone', 'ఫోన్'), parentUser?.phone]])}
    </Box>
    <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 4, border: '1px solid #e2ebe5' }}><Typography component="h2" variant="h6" fontWeight={800}>{text('Make yourself at home', 'యాప్‌ను సులభంగా ఉపయోగించండి')}</Typography><Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} sx={{ my: 2 }}><Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{text('Install the app for quick access to attendance, homework, and rewards.', 'హాజరు, హోమ్‌వర్క్, బహుమతులు సులభంగా చూడటానికి యాప్ ఇన్‌స్టాల్ చేయండి.')}</Typography><InstallButton /></Stack><Divider sx={{ my: 2 }} /><Button variant="outlined" disabled={busy} onClick={enableAlerts}>{busy ? text('Connecting…', 'కనెక్ట్ అవుతోంది…') : text('Enable device alerts', 'పరికరంలో సమాచారం పొందండి')}</Button>{message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}</Paper>
  </Box>;
}
