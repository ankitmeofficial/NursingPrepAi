import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ label, variant = 'primary', style, textStyle }: BadgeProps) {
  const colors = useTheme();

  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primaryLight, text: colors.primaryDark };
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'error':
        return { bg: colors.errorLight, text: colors.error };
      case 'neutral':
      default:
        return { bg: colors.surfaceMuted, text: colors.textSecondary };
    }
  };

  const { bg, text } = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...Typography.badge,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
