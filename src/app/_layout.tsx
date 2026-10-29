import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

import { FontSizeProvider } from '@/context/FontSizeContext';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { LanguageProvider } from '@/hooks/use-language';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootContent() {
  const { isDark } = useThemeContext();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="paper/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="practice/setup" options={{ headerShown: false }} />
        <Stack.Screen name="practice/session" options={{ headerShown: false }} />
        <Stack.Screen name="practice/results" options={{ headerShown: false }} />
        <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <LanguageProvider>
          <RootContent />
        </LanguageProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
}
