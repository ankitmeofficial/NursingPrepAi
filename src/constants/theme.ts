import '@/global.css';

import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  light: {
    // Primary brand colors (Warm Terracotta / Rust Crimson: #C63D0F)
    primary: '#C63D0F',
    primaryDark: '#9E2D07',
    primaryLight: '#FCEEE8',
    primaryMuted: '#F6C4B4',
    accent: '#6E8B75', // Muted Sage Green from palette
    accentLight: '#EFF5F1',
    accentDark: '#4A6852',

    // Backgrounds & Surfaces (Warm Ivory Linen #FDF3E7 & Crisp White)
    background: '#FAF6F0',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F4ECE1',
    backgroundElement: '#F7EFE4',
    backgroundSelected: '#FCEEE8',

    // Borders
    border: '#E8DDD0',
    borderLight: '#F3EBE0',

    // Text (Smoky Charcoal #3B3738)
    text: '#3B3738',
    textSecondary: '#665F60',
    textTertiary: '#9E9596',
    textInverse: '#FFFFFF',

    // Semantic status & Accents
    success: '#567D62', // Sage Green
    successLight: '#E8F2EA',
    warning: '#D97706',
    warningLight: '#FEF3C7', // User's warm yellow tint
    error: '#C63D0F',
    errorLight: '#FEE9E2',
    info: '#6E8B75',
    infoLight: '#EFF5F1',

    // Tab Bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E8DDD0',
    tabBarActive: '#C63D0F',
    tabBarInactive: '#8C8283',
  },
  dark: {
    // Primary brand colors (Vibrant Glowing Terracotta Flame based on #C63D0F)
    primary: '#E05A2B',
    primaryDark: '#C63D0F',
    primaryLight: '#441B0F',
    primaryMuted: '#6E2813',
    accent: '#93AB98', // Illuminated Sage Green
    accentLight: '#223326',
    accentDark: '#B4CAB8',

    // Backgrounds & Surfaces (Deep Warm Charcoal derived from #3B3738)
    background: '#221F20',
    card: '#2D292A',
    surface: '#2D292A',
    surfaceMuted: '#3B3738', // Exact #3B3738 from palette
    backgroundElement: '#3B3738',
    backgroundSelected: '#441B0F',

    // Borders
    border: '#464041',
    borderLight: '#3B3738',

    // Text (Warm Ivory Cream from palette)
    text: '#FAF5EE',
    textSecondary: '#C4BCB6',
    textTertiary: '#8E8582',
    textInverse: '#221F20',

    // Semantic status & Accents
    success: '#82B28B',
    successLight: '#1B3621',
    warning: '#FBBF24',
    warningLight: '#523405',
    error: '#F87171',
    errorLight: '#4A1B14',
    info: '#E05A2B',
    infoLight: '#441B0F',

    // Tab Bar
    tabBar: '#272324',
    tabBarBorder: '#3B3738',
    tabBarActive: '#E05A2B',
    tabBarInactive: '#8E8582',
  },
} as const;

export type ThemePalette = {
  [K in keyof typeof Colors.light]: string;
};
export type ThemeColors = ThemePalette;
export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  // Named scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Legacy aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  header: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bodyBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  badge: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
  },
} as const;

export const Shadows = StyleSheet.create({
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
