import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowForwardRounded, ChatBubbleOutlineRounded, PersonOutlineRounded } from '@mui/icons-material';
import { activityDate, parentAttendance } from '../../../utils/parentActivity';

export default function HomeTab({ student, parentLang = 'te' }) {
  const text = (english, telugu) => parentLang === 'te' ? telugu : english;
  if (!student) return <Alert severity="info">{text('No child is linked to your account. Please contact the school.', 'మీ ఖాతాకు పిల్లవాడి వివరాలు లేవు. పాఠశాలను సంప్రదించండి.')}</Alert>;

  const latest = parentAttendance(student)[0];
  const date = latest && activityDate(latest.date);
  const lastAttendance = latest?.status === 'present' ? text('Present', 'హాజరు') : text('Absent', 'గైర్హాజరు');
  const details = [
    [text('Latest attendance', 'తాజా హాజరు'), latest ? lastAttendance : '—',
      date?.toLocaleDateString(parentLang === 'te' ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
    [text('Dollar balance', 'డాలర్ల నిల్వ'), '$' + (Number(student.dollarPoints) || 0)],
  ];

  return <Stack spacing={{ xs: 2, sm: 3 }}>
    <Paper elevation={0} sx={theme => ({
      borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider',
      backgroundImage: 'none',
      '& .child-heading': { color: '#fff', background: `linear-gradient(115deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})` },
    })}>
      <Box className="child-heading" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="body2">{text('My child', 'నా బిడ్డ')}</Typography>
        <Typography component="h1" variant="h4" fontWeight={800} sx={{ my: 1, overflowWrap: 'anywhere' }}>{student.name}</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>{[student.classType, student.place || student.location, student.studentId].filter(Boolean).map((value, index) =>
          <Chip key={index} size="small" label={value} sx={{ color: 'inherit', bgcolor: '#ffffff26' }} />)}</Stack>
      </Box>
      <Box component="dl" sx={{ m: 0, py: 2.5, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {details.map(([label, value, note], index) => <Box key={label} sx={{ px: { xs: 2, sm: 4 }, borderLeft: index ? '1px solid' : 0, borderColor: 'divider' }}>
          <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
          <Typography component="dd" sx={{ m: 0, color: 'primary.main', fontSize: { xs: 21, sm: 26 }, fontWeight: 800 }}>{value}</Typography>
          {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
        </Box>)}
      </Box>
    </Paper>
    <Box component="nav" aria-label={text('Parent actions', 'తల్లిదండ్రుల ఎంపికలు')} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
      {[
        ['/parent/child', <PersonOutlineRounded />, text('My Child Details', 'నా పిల్లవాడి వివరాలు'), text('View attendance and rewards', 'హాజరు, బహుమతులు చూడండి')],
        ['/parent/complaints', <ChatBubbleOutlineRounded />, text('Complaints & Help', 'ఫిర్యాదులు & సహాయం'), text('Contact the school and read replies', 'పాఠశాలను సంప్రదించండి, జవాబులు చూడండి')],
      ].map(([to, icon, title, description]) => <Button component={Link} to={to} key={to} sx={{
        p: 2, gap: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'left', textTransform: 'none',
        '&:focus-visible': { outline: '2px solid', outlineOffset: 2 },
      }}>
        <Box sx={theme => ({ display: 'grid', placeItems: 'center', flexShrink: 0, width: 42, height: 42, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, .09) })}>{icon}</Box>
        <Box sx={{ flex: 1 }}><Typography component="span" display="block" color="text.primary" fontWeight={750}>{title}</Typography><Typography component="span" variant="body2" color="text.secondary">{description}</Typography></Box>
        <ArrowForwardRounded fontSize="small" />
      </Button>)}
    </Box>
  </Stack>;
}
