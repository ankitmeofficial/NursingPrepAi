import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, style, variant = 'elevated', ...rest }: CardProps) {
  const colors = useTheme();

  const variantStyle: ViewStyle = {
    backgroundColor: variant === 'flat' ? colors.surfaceMuted : colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    ...(variant === 'elevated' ? Shadows.sm : {}),
  };

  return (
    <View style={[styles.card, variantStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
  },
});
