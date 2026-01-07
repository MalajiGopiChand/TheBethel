import React from 'react';
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
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);

  // Load theme preference from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const handleThemeChange = (event) => {
    const newDarkMode = event.target.checked;
    setDarkMode(newDarkMode);
    localStorage.setItem('themePreference', newDarkMode ? 'dark' : 'light');
    // You can also trigger a theme change event here if needed
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/dashboard')}>
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
                  checked={darkMode}
                  onChange={handleThemeChange}
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
              School Management System - The Bethel Church
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SettingsPage;

