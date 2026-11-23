import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../utils/theme';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('themePreference');
      if (savedTheme === 'dark') return true;
      return false; // Force light mode default
    } catch (e) {
      return false;
    }
  });

  const location = useLocation();
  const forceLightMode = location.pathname.startsWith('/teacher') || location.pathname.startsWith('/parent');
  
  const effectiveDarkMode = forceLightMode ? false : isDarkMode;

  useEffect(() => {
    localStorage.setItem('themePreference', isDarkMode ? 'dark' : 'light');
    if (effectiveDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode, effectiveDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const parentView = location.pathname.startsWith('/parent');
  const theme = useMemo(() => parentView ? createTheme(lightTheme, {
    palette: { primary: { main: '#17695e', dark: '#164f46', light: '#eaf2ed', contrastText: '#ffffff' }, background: { default: '#f4f7f6', paper: '#ffffff' }, text: { primary: '#182f2c', secondary: '#637a70' } },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: 12, textTransform: 'none', fontWeight: 700, boxShadow: 'none' } } },
      MuiCard: { styleOverrides: { root: { boxShadow: '0 4px 20px #193c3008', border: '1px solid #e2ebe5' } } },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 20 } } },
      MuiTypography: { styleOverrides: { root: { overflowWrap: 'anywhere' } } },
    },
  }) : effectiveDarkMode ? darkTheme : lightTheme, [effectiveDarkMode, parentView]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, effectiveDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
