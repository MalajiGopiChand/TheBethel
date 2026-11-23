import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { handleBackNavigation } from '../../../utils/navigation';
import ParentAnnouncements from '../components/ParentAnnouncements';

export default function ParentNotificationPage() {
  const navigate = useNavigate();
  const { parentLang } = useOutletContext();
  return <section>
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
      <Button onClick={() => handleBackNavigation(navigate)} startIcon={<ArrowBack />}>{parentLang === 'te' ? 'వెనక్కి' : 'Back'}</Button>
      <Typography variant="h5" component="h1" fontWeight={800}>{parentLang === 'te' ? 'పాఠశాల ప్రకటనలు' : 'School announcements'}</Typography>
    </Stack>
    <ParentAnnouncements parentLang={parentLang} />
  </section>;
}
