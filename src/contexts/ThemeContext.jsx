import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../utils/theme';
import { useAuth } from './AuthContext';

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
  const { currentUser } = useAuth();
  const forceLightMode = currentUser?.role !== 'ADMIN' && (location.pathname.startsWith('/teacher') || location.pathname.startsWith('/parent'));
  
  const effectiveDarkMode = forceLightMode ? false : isDarkMode;

  useEffect(() => {
    try { localStorage.setItem('themePreference', isDarkMode ? 'dark' : 'light'); } catch { /* Storage can be unavailable in private browsing. */ }
    if (effectiveDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode, effectiveDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = useMemo(() => effectiveDarkMode ? darkTheme : lightTheme, [effectiveDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, effectiveDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
