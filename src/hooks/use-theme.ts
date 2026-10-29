/**
 * Provides theme colors and dark mode state based on active theme setting
 */

import { useThemeContext } from '@/context/ThemeContext';

export function useTheme() {
  const { colors } = useThemeContext();
  return colors;
}

export function useThemeInfo() {
  const { isDark, colors, themeMode, setThemeMode } = useThemeContext();
  return { isDark, colors, themeMode, setThemeMode };
}
