import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useThemeContext } from '@/context/ThemeContext';

export interface BackgroundPalette {
  name: string;
  primaryGlow: string;
  secondaryGlow: string;
  accentGlow: string;
  subtleTint: string;
}

export const AMBIENT_PALETTES: BackgroundPalette[] = [
  {
    name: 'Terracotta Flame',
    primaryGlow: 'rgba(198, 61, 15, 0.24)',
    secondaryGlow: 'rgba(255, 107, 53, 0.20)',
    accentGlow: 'rgba(255, 240, 86, 0.22)',
    subtleTint: 'rgba(253, 243, 231, 0.35)',
  },
  {
    name: 'Clinical Cyan',
    primaryGlow: 'rgba(2, 132, 199, 0.22)',
    secondaryGlow: 'rgba(14, 165, 233, 0.18)',
    accentGlow: 'rgba(56, 189, 248, 0.25)',
    subtleTint: 'rgba(224, 242, 254, 0.35)',
  },
  {
    name: 'Vital Emerald',
    primaryGlow: 'rgba(5, 150, 105, 0.22)',
    secondaryGlow: 'rgba(16, 185, 129, 0.18)',
    accentGlow: 'rgba(52, 211, 153, 0.25)',
    subtleTint: 'rgba(220, 252, 231, 0.35)',
  },
  {
    name: 'Deep Aurora',
    primaryGlow: 'rgba(99, 102, 241, 0.22)',
    secondaryGlow: 'rgba(139, 92, 246, 0.18)',
    accentGlow: 'rgba(168, 85, 247, 0.25)',
    subtleTint: 'rgba(237, 233, 254, 0.35)',
  },
  {
    name: 'Golden Pulse',
    primaryGlow: 'rgba(217, 119, 6, 0.20)',
    secondaryGlow: 'rgba(245, 158, 11, 0.16)',
    accentGlow: 'rgba(251, 191, 36, 0.22)',
    subtleTint: 'rgba(254, 243, 199, 0.35)',
  },
  {
    name: 'Rose Vitality',
    primaryGlow: 'rgba(225, 29, 72, 0.20)',
    secondaryGlow: 'rgba(244, 63, 94, 0.16)',
    accentGlow: 'rgba(251, 113, 133, 0.22)',
    subtleTint: 'rgba(255, 228, 230, 0.35)',
  },
  {
    name: 'Oceanic Teal',
    primaryGlow: 'rgba(13, 148, 136, 0.22)',
    secondaryGlow: 'rgba(20, 184, 166, 0.18)',
    accentGlow: 'rgba(45, 212, 191, 0.25)',
    subtleTint: 'rgba(204, 251, 241, 0.35)',
  },
];

interface InteractiveReelBackgroundProps {
  currentIndex: number;
  isAnswered?: boolean;
  isCorrect?: boolean;
  onThemeCycle?: (themeName: string) => void;
}

export function InteractiveReelBackground({
  currentIndex,
  isAnswered,
  isCorrect,
  onThemeCycle,
}: InteractiveReelBackgroundProps) {
  const { isDark } = useThemeContext();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

  // Manual theme offset so user tapping background can shift colors
  const [tapCycleOffset, setTapCycleOffset] = useState<number>(0);

  // Compute active palette based on question index + user tap cycles
  const activePaletteIndex =
    (currentIndex + tapCycleOffset) % AMBIENT_PALETTES.length;
  const currentPalette = AMBIENT_PALETTES[activePaletteIndex];

  // Floating Orb Animated Values
  const [orb1TranslateX] = useState(() => new Animated.Value(0));
  const [orb1TranslateY] = useState(() => new Animated.Value(0));
  const [orb1Scale] = useState(() => new Animated.Value(1));

  const [orb2TranslateX] = useState(() => new Animated.Value(0));
  const [orb2TranslateY] = useState(() => new Animated.Value(0));
  const [orb2Scale] = useState(() => new Animated.Value(1));

  const [orb3TranslateX] = useState(() => new Animated.Value(0));
  const [orb3TranslateY] = useState(() => new Animated.Value(0));

  // Answer Reaction Flash Animated Value
  const [reactionOpacity] = useState(() => new Animated.Value(0));

  // Interactive Tap Ripple Animated Values
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);
  const [rippleScale] = useState(() => new Animated.Value(0));
  const [rippleOpacity] = useState(() => new Animated.Value(0));

  // Smooth background color crossfade
  const [fadeAnim] = useState(() => new Animated.Value(1));

  // Floating orbs continuous idle animation
  useEffect(() => {
    // Orb 1 subtle drift
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1TranslateX, {
            toValue: 35,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1TranslateY, {
            toValue: -40,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Scale, {
            toValue: 1.15,
            duration: 6500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb1TranslateX, {
            toValue: -25,
            duration: 7500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1TranslateY, {
            toValue: 30,
            duration: 7500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Scale, {
            toValue: 0.9,
            duration: 7500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Orb 2 counter-drift
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2TranslateX, {
            toValue: -30,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2TranslateY, {
            toValue: 45,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Scale, {
            toValue: 1.2,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb2TranslateX, {
            toValue: 25,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2TranslateY, {
            toValue: -25,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Scale, {
            toValue: 0.95,
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Orb 3 drift
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(orb3TranslateX, {
          toValue: 20,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orb3TranslateX, {
          toValue: -20,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [orb1TranslateX, orb1TranslateY, orb1Scale, orb2TranslateX, orb2TranslateY, orb2Scale, orb3TranslateX]);

  // Answer reaction flash
  useEffect(() => {
    if (isAnswered) {
      reactionOpacity.setValue(0.5);
      Animated.timing(reactionOpacity, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isAnswered, isCorrect, reactionOpacity]);

  // Pulse effect on question transition
  useEffect(() => {
    fadeAnim.setValue(0.6);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [currentIndex, tapCycleOffset, fadeAnim]);

  // Handle interactive tap anywhere on background
  const handleBackgroundTap = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    setTapPosition({ x: locationX || windowWidth / 2, y: locationY || windowHeight / 2 });

    // Cycle palette
    const nextOffset = (tapCycleOffset + 1) % AMBIENT_PALETTES.length;
    setTapCycleOffset(nextOffset);
    if (onThemeCycle) {
      const nextPal = AMBIENT_PALETTES[(currentIndex + nextOffset) % AMBIENT_PALETTES.length];
      onThemeCycle(nextPal.name);
    }

    // Ripple animation
    rippleScale.setValue(0.2);
    rippleOpacity.setValue(0.8);
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 2.8,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTapPosition(null);
    });
  };

  // Dark vs Light mode ambient opacity adjustments
  const baseOpacity = isDark ? 0.85 : 0.45;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Tap listener on outer layer */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleBackgroundTap}
        accessibilityRole="none"
        accessibilityLabel="Interactive ambient background"
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: fadeAnim },
        ]}
        pointerEvents="none">
        {/* Subtle geometric grid / ambient wash */}
        <View
          style={[
            styles.ambientWash,
            {
              backgroundColor: isDark ? '#090D16' : '#F1F5F9',
            },
          ]}
        />

        {/* Floating Glowing Orb 1 (Top Right) */}
        <Animated.View
          style={[
            styles.glowOrb,
            {
              top: -60,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: currentPalette.primaryGlow,
              opacity: baseOpacity,
              transform: [
                { translateX: orb1TranslateX },
                { translateY: orb1TranslateY },
                { scale: orb1Scale },
              ],
            },
          ]}
        />

        {/* Floating Glowing Orb 2 (Middle Left) */}
        <Animated.View
          style={[
            styles.glowOrb,
            {
              top: '40%',
              left: -100,
              width: 340,
              height: 340,
              borderRadius: 170,
              backgroundColor: currentPalette.secondaryGlow,
              opacity: baseOpacity * 0.9,
              transform: [
                { translateX: orb2TranslateX },
                { translateY: orb2TranslateY },
                { scale: orb2Scale },
              ],
            },
          ]}
        />

        {/* Floating Glowing Orb 3 (Bottom Center) */}
        <Animated.View
          style={[
            styles.glowOrb,
            {
              bottom: -90,
              left: '20%',
              width: 380,
              height: 380,
              borderRadius: 190,
              backgroundColor: currentPalette.accentGlow,
              opacity: baseOpacity * 0.8,
              transform: [
                { translateX: orb3TranslateX },
                { translateY: orb3TranslateY },
              ],
            },
          ]}
        />

        {/* Answer Selection Reaction Flash */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: reactionOpacity,
              backgroundColor: isCorrect
                ? 'rgba(52, 211, 153, 0.28)'
                : 'rgba(239, 68, 68, 0.24)',
            },
          ]}
        />

        {/* Interactive Tap Ripple */}
        {tapPosition && (
          <Animated.View
            style={[
              styles.tapRipple,
              {
                left: tapPosition.x - 75,
                top: tapPosition.y - 75,
                backgroundColor: currentPalette.accentGlow,
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ambientWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  glowOrb: {
    position: 'absolute',
    // Glassy bloom blur
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(65px)',
          willChange: 'transform',
        } as any)
      : {}),
  },
  tapRipple: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(12px)',
        } as any)
      : {}),
  },
});
