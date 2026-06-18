import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme, Theme } from '@/constants/theme';

const STORAGE_KEY = 'theme-preference';
export type ThemePreference = 'system' | 'light' | 'dark';

type ThemePreferenceContextType = {
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextType | null>(null);
const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'system' || value === 'light' || value === 'dark') {
          setPreferenceState(value);
        }
      })
      .catch((err) => {
        console.error('ThemeProvider: failed to read preference', err);
      });
  }, []);

  const setThemePreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((err) => {
      console.error('ThemeProvider: failed to write preference', err);
    });
  }, []);

  // Before hydration we use 'system' (so the first paint matches the device).
  const isDark =
    preference === 'system'
      ? systemColorScheme === 'dark'
      : preference === 'dark';

  const theme = createTheme(isDark);

  return (
    <ThemeContext.Provider value={theme}>
      <ThemePreferenceContext.Provider value={{ preference, setThemePreference }}>
        {children}
      </ThemePreferenceContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}

export function useThemePreference(): ThemePreferenceContextType {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within a ThemeProvider');
  }
  return ctx;
}
