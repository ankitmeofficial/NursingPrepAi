import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, ThemeColors } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: ThemeColors;
}

const THEME_STORAGE_KEY = '@nursing_prep_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: async () => {},
  isDark: false,
  colors: Colors.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setThemeModeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {}
  };

  const isDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
