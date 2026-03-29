import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../utils/theme';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('themePreference');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      // Default to dark mode if system prefers it, otherwise light
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  const theme = useMemo(() => effectiveDarkMode ? darkTheme : lightTheme, [effectiveDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, effectiveDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
