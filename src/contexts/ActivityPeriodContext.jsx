import SchoolLoader from '../components/SchoolLoader';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot } from "../services/notifyingFirestore";
import { Alert, Box, Button } from '@mui/material';
import { useAuth } from './AuthContext';
import { periodSettingsRef, setActivePeriod, websitePeriodsEnabled } from '../services/studentData';

const ActivityPeriodContext = createContext({ period: null, resetAt: null });
export const useActivityPeriod = () => useContext(ActivityPeriodContext);
export default function ActivityPeriodProvider({ children }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState({ uid: null, ready: false, period: null, resetAt: null, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setActivePeriod(null);
    if (!currentUser?.uid || !websitePeriodsEnabled) { setState({ uid: currentUser?.uid || null, ready: true, period: null, resetAt: null, error: '' }); return; }
    setState(previous => ({ ...previous, uid: currentUser.uid, ready: false, error: '' }));
    return onSnapshot(periodSettingsRef(), snapshot => {
      const data = snapshot.data();
      setActivePeriod(data?.activePeriod);
      setState({ uid: currentUser.uid, ready: true, period: data?.activePeriod || null, resetAt: data?.resetAt || null, error: '' });
    }, () => {
      // Fail closed: do not show historical data if the active period cannot be verified.
      setState(previous => ({ ...previous, ready: false, error: 'Unable to load the website data period. Check your connection. Administrators: the updated Firestore rules must be deployed before using this version.' }));
    });
  }, [currentUser?.uid, retry]);
  if (currentUser && (state.uid !== currentUser.uid || !state.ready)) return <Box sx={{ p: 3 }}>
    {state.error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{state.error}</Alert> : <SchoolLoader role={currentUser.role} />}
  </Box>;
  return <ActivityPeriodContext.Provider value={state}><React.Fragment key={`${state.uid}:${state.period || 'original'}`}>{children}</React.Fragment></ActivityPeriodContext.Provider>;
}
