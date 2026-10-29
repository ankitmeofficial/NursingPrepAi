import React from 'react';
import {
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  useTopSafeArea?: boolean;
}

export function ScreenContainer({
  children,
  scrollable = true,
  contentContainerStyle,
  style,
  useTopSafeArea = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  // Bottom inset is automatically handled by the bottom tab bar navigator,
  // but we provide comfortable internal padding for content spacing.
  const paddingBottom = Spacing.xxl + Math.max(insets.bottom, 8);
  const paddingTop = useTopSafeArea
    ? Math.max(insets.top + (Platform.OS === 'web' ? 12 : 8), Spacing.md)
    : Spacing.lg;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const innerStyle: ViewStyle = {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop,
    paddingBottom,
  };

  if (scrollable) {
    return (
      <View style={[containerStyle, style]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[innerStyle, contentContainerStyle]}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[containerStyle, innerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
