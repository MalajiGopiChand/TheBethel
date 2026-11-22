import { useAuth } from '../../../contexts/AuthContext';
import { useActivityPeriod } from '../../../contexts/ActivityPeriodContext';
import { startNewActivityPeriod, websitePeriodsEnabled } from '../../../services/studentData';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { handleBackNavigation } from '../../../utils/navigation';
import { useAppTheme } from '../../../contexts/ThemeContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { period, resetAt } = useActivityPeriod();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const isAdmin = currentUser?.role === 'ADMIN' || ['gop1@gmail.com', 'premkumartenali@gmail.com'].includes(currentUser?.email);
  const resetData = async () => {
    if (!isAdmin || resetting) return;
    setResetting(true); setResetError('');
    try { await startNewActivityPeriod(currentUser.uid); setConfirmReset(false); }
    catch (error) { setResetError('Reset failed. No data was deleted. Check your connection and make sure the updated Firestore rules are deployed.'); }
    finally { setResetting(false); }
  };
  const { isDarkMode, toggleTheme } = useAppTheme();
  
  const handleBack = () => {
    handleBackNavigation(navigate);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Settings
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxWidth: 800, mx: 'auto', width: '100%' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              App Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DarkModeIcon sx={{ mr: 1 }} />
                  <Typography>Dark Mode</Typography>
                </Box>
              }
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Theme preference is saved in your browser's local storage.
            </Alert>
          </CardContent>
        </Card>

        {isAdmin && <Card id="data-reset" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Reset website attendance & dollars</Typography>
            <Typography sx={{ mb: 2 }}>Start a fresh period for everyone using this website. Students and their profile details stay visible. Attendance, absence history, streaks, rewards, and dollar totals start at zero.</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>Earlier records stay in the database. This does not delete students or change chat, complaints, homework, staff reports, or finances. The Android app's original records are unchanged.</Alert>
            {period && <Alert severity="success" sx={{ mb: 2 }}>A fresh website period is active{resetAt?.toDate ? ` since ${resetAt.toDate().toLocaleString()}` : ''}. Earlier records are retained.</Alert>}
            {!websitePeriodsEnabled && <Alert severity="warning" sx={{ mb: 2 }}>Setup required: deploy the updated database rules, then enable website periods in the website configuration. Reset is disabled until setup is complete; your current data is unchanged.</Alert>}
            {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
            <Button variant="outlined" color="warning" disabled={resetting || !websitePeriodsEnabled} onClick={() => setConfirmReset(true)}>Reset website data</Button>
          </CardContent>
        </Card>}
        <Dialog open={confirmReset} onClose={() => { if (!resetting) setConfirmReset(false); }} fullWidth maxWidth="sm">
          <DialogTitle>Start a fresh website period?</DialogTitle>
          <DialogContent>
            <Typography>This affects all website users immediately. Existing attendance and dollar records will disappear from website views and exports, but remain stored in the database. Student profiles remain available. New records will be saved in the new period.</Typography>
            <Typography sx={{ mt: 2 }}>Any unsaved forms open on the website will be cleared. This action cannot be undone from Settings.</Typography>
            {resetError && <Alert severity="error" sx={{ mt: 2 }}>{resetError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button disabled={resetting} onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="contained" color="warning" disabled={resetting} onClick={resetData}>{resetting ? <CircularProgress size={20} /> : 'Start fresh — keep database history'}</Button>
          </DialogActions>
        </Dialog>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Version: 1.0.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sunday School Management - The Bethel Church
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SettingsPage;

