import SchoolLoader from '../../../components/SchoolLoader';
import React, { useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import { collection, onSnapshot } from '../../../services/notifyingFirestore';
import { db } from '../../../config/firebase';
import { parentAnnouncements } from '../../../utils/parentAnnouncements';
import AnnouncementsSection from '../../../components/AnnouncementsSection';

export default function ParentAnnouncements({ parentLang, maximum }) {
  const telugu = parentLang === 'te';
  const [feed, setFeed] = useState({ status: 'loading', items: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setFeed({ status: 'loading', items: [] });
    // Firestore orderBy excludes documents missing that field. Both timestamp formats are in use.
    return onSnapshot(collection(db, 'notifications'), snapshot => {
      const items = parentAnnouncements(snapshot.docs, telugu ? 'te-IN' : 'en-IN', maximum);
      setFeed({ status: 'ready', items });
    }, () => setFeed({ status: 'error', items: [] }));
  }, [telugu, maximum, attempt]);

  if (feed.status === 'loading') return <div className="portal-empty portal-surface" role="status"><SchoolLoader role="parent" compact message={telugu ? 'ప్రకటనలు లోడ్ అవుతున్నాయి…' : 'Preparing your announcements'} /></div>;
  if (feed.status === 'error') return <Alert severity="error" action={<Button color="inherit" onClick={() => setAttempt(n => n + 1)}>{telugu ? 'మళ్లీ ప్రయత్నించండి' : 'Retry'}</Button>}>{telugu ? 'ప్రకటనలు లోడ్ కాలేదు.' : 'Could not load announcements.'}</Alert>;
  if (!feed.items.length) return <div className="portal-empty portal-surface">{telugu ? 'కొత్త ప్రకటనలు లేవు.' : 'No announcements yet.'}</div>;
  return <AnnouncementsSection announcements={feed.items} />;
}
