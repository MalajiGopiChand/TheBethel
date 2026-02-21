import { createTheme } from '@mui/material/styles';

// **New expressive light theme with stronger identity and softer surfaces**
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4C6FFF',        // Indigo / blue accent
      light: '#7C8CFF',
      dark: '#2332B3',
    },
    secondary: {
      main: '#FF6B9C',        // Warm accent for highlights
      light: '#FF98B8',
      dark: '#CC3A6E',
    },
    background: {
      default: '#f3f5fb',
      paper: 'rgba(255,255,255,0.96)',
    },
    success: {
      main: '#40C6A3',
    },
    warning: {
      main: '#FFB547',
    },
    error: {
      main: '#F45B69',
    },
    divider: 'rgba(15,23,42,0.06)',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: [
      '"Poppins"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 800, letterSpacing: '-0.08rem' },
    h2: { fontWeight: 800, letterSpacing: '-0.06rem' },
    h3: { fontWeight: 800, letterSpacing: '-0.04rem' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage:
            'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(244,247,255,0.96))',
          boxShadow:
            '0 18px 45px rgba(15,23,42,0.06), 0 0 0 1px rgba(148,163,184,0.18)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          overflow: 'hidden',
          position: 'relative',
          backgroundImage:
            'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(236,244,255,0.98))',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
          paddingInline: 20,
        },
        containedPrimary: {
          boxShadow:
            '0 14px 30px rgba(76,111,255,0.35), 0 0 0 1px rgba(15,23,42,0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage:
            'linear-gradient(120deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))',
        },
      },
    },
  },
});

// **Dark theme tuned to match the new light theme**
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8B9DFF',
      light: '#B0BEFF',
      dark: '#4C5ACF',
    },
    secondary: {
      main: '#FF89B0',
      light: '#FFB3CC',
      dark: '#CC4A7A',
    },
    background: {
      default: '#020617',
      paper: '#020617',
    },
    success: {
      main: '#34D399',
    },
    warning: {
      main: '#FACC15',
    },
    error: {
      main: '#FB7185',
    },
    divider: 'rgba(148,163,184,0.25)',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: [
      '"Poppins"',
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
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage:
            'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.93))',
          boxShadow:
            '0 18px 45px rgba(15,23,42,0.85), 0 0 0 1px rgba(30,64,175,0.55)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          overflow: 'hidden',
          position: 'relative',
          backgroundImage:
            'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(circle at 100% 100%, rgba(244,114,182,0.18), #020617)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Action item color presets matching Android app (kept but tuned to new palette)
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

