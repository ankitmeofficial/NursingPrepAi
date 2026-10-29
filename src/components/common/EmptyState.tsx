import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Badge, BadgeVariant } from './Badge';

interface EmptyStateProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  iconName,
  title,
  description,
  badgeLabel,
  badgeVariant = 'neutral',
  style,
}: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={iconName} size={32} color={colors.primary} />
      </View>

      {badgeLabel ? (
        <Badge
          label={badgeLabel}
          variant={badgeVariant}
          style={styles.badge}
        />
      ) : null}

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginVertical: Spacing.xs,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  badge: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
});
