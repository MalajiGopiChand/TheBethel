import { createTheme, alpha } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f50057',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#f06292',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Action item color presets matching Android app
export const actionColors = {
  liveChat: { start: '#4FACFE', end: '#00F2FE' },
  markAttendance: { start: '#43E97B', end: '#38F9D7' },
  homework: { start: '#FA709A', end: '#FEE140' },
  messages: { start: '#4FACFE', end: '#00F2FE' },
  addStudent: { start: '#D4FC79', end: '#96E6A1' },
  viewStudents: { start: '#A1C4FD', end: '#C2E9FB' },
  studentDetails: { start: '#FF9A9E', end: '#FECFEF' },
  absentStudents: { start: '#F093FB', end: '#F5576C' },
  deleteStudent: { start: '#FEE140', end: '#FA709A' },
  giveDollars: { start: '#FFECD2', end: '#FCB69F' },
  viewDollarHistory: { start: '#FFECD2', end: '#FCB69F' },
  leaderboard: { start: '#FFE53B', end: '#FF2525' },
  downloads: { start: '#80CBC4', end: '#B2DFDB' },
  schedules: { start: '#EF9A9A', end: '#FFCDD2' },
  teacherProgress: { start: '#A8EDEA', end: '#FED6E3' },
  staffAttendance: { start: '#FFAB91', end: '#FFCCBC' },
  finance: { start: '#FF9A9E', end: '#FAD0C4' },
};

