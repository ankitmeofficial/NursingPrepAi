import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/constants/theme';
import { useLanguage } from '@/hooks/use-language';
import { useThemeInfo } from '@/hooks/use-theme';

export default function TabLayout() {
  const { colors } = useThemeInfo();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const tabBottomPadding = Math.max(
    insets.bottom,
    Platform.select({ ios: insets.bottom > 0 ? insets.bottom : 16, default: 8 })
  );
  const tabHeight = (Platform.OS === 'ios' ? 56 : 60) + tabBottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 62 : tabHeight,
          paddingBottom: Platform.OS === 'web' ? 2 : tabBottomPadding,
          paddingTop: 4,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: colors.card,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          ...Typography.title,
          color: colors.text,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'NursingPrep',
          tabBarLabel: t('tabs.home'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: t('tabs.reels'),
          tabBarLabel: t('tabs.reels'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'play-circle' : 'play-circle-outline'}
              size={23}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarLabel: t('tabs.progress'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
