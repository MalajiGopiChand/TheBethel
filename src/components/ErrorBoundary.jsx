import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      const isUpdate = /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported module/i.test(this.state.error?.message || '');
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: 'background.default'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center'
            }}
          >
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {isUpdate ? 'An updated version is available' : 'Something went wrong'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isUpdate ? 'Reload this page to get the latest version. Your saved school records are safe.' : this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            <Button
              variant="contained"
              onClick={isUpdate ? this.handleReload : this.handleReset}
              sx={{ mt: 2 }}
            >
              {isUpdate ? 'Reload this page' : 'Go to Home'}
            </Button>
            {import.meta.env.DEV && this.state.errorInfo && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
