import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  subtitle,
  rightAction,
  style,
}: SectionHeaderProps) {
  const colors = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleWrapper}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View style={styles.actionWrapper}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  actionWrapper: {
    marginLeft: Spacing.md,
  },
});
