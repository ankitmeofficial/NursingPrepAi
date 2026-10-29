import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';

interface ReelInstructionsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ReelInstructionsModal({ visible, onDismiss }: ReelInstructionsModalProps) {
  const colors = useTheme();
  const { t } = useLanguage();

  // Entrance animations
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.92));

  // Animated gesture hand / arrow loop
  const [gestureTranslateY] = useState(() => new Animated.Value(0));
  const [gestureOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Continuous gesture movement: Upward swipe -> Pause -> Downward swipe -> Pause
  useEffect(() => {
    if (!visible) return;

    const gestureLoop = Animated.loop(
      Animated.sequence([
        // Swipe UP motion
        Animated.parallel([
          Animated.timing(gestureTranslateY, {
            toValue: -32,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(gestureOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(gestureOpacity, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Reset to center
        Animated.timing(gestureTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Swipe DOWN motion
        Animated.parallel([
          Animated.timing(gestureTranslateY, {
            toValue: 32,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(gestureOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(gestureOpacity, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Reset to center
        Animated.timing(gestureTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Brief pause
        Animated.delay(400),
      ])
    );

    gestureLoop.start();

    return () => {
      gestureLoop.stop();
    };
  }, [visible, gestureTranslateY, gestureOpacity]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          {/* Header with Icon and Title */}
          <View style={styles.header}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t('reels.tutorialTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('reels.tutorialSubtitle')}
              </Text>
            </View>
          </View>

          {/* Animated Gesture Showcase Card */}
          <View
            style={[
              styles.gestureBox,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}>
            <View style={styles.gestureDirectionColumn}>
              <View style={styles.gestureIndicatorRow}>
                <Ionicons name="arrow-up" size={16} color={colors.primary} />
                <Text style={[styles.gestureDirText, { color: colors.primary }]}>
                  {t('reels.tutorialScrollUpTitle')}
                </Text>
              </View>

              {/* Animated Interactive Gesture Icon */}
              <View style={[styles.gestureTrack, { borderColor: colors.borderLight }]}>
                <Animated.View
                  style={[
                    styles.gestureHand,
                    {
                      backgroundColor: colors.primary,
                      opacity: gestureOpacity,
                      transform: [{ translateY: gestureTranslateY }],
                    },
                  ]}>
                  <Ionicons name="finger-print" size={22} color={colors.textInverse} />
                </Animated.View>
              </View>

              <View style={styles.gestureIndicatorRow}>
                <Ionicons name="arrow-down" size={16} color={colors.primary} />
                <Text style={[styles.gestureDirText, { color: colors.primary }]}>
                  {t('reels.tutorialScrollDownTitle')}
                </Text>
              </View>
            </View>

            <View style={styles.gestureDescription}>
              <Text style={[styles.gestureHint, { color: colors.text }]}>
                {t('reels.tutorialScrollUpDesc')}
              </Text>
              <Text style={[styles.gestureSubHint, { color: colors.textSecondary }]}>
                {t('reels.tutorialScrollDownDesc')}
              </Text>
            </View>
          </View>

          {/* Instruction Feature List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-done" size={16} color={colors.success} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {t('reels.tutorialAnswerTitle')}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {t('reels.tutorialAnswerDesc')}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="bookmark" size={16} color={colors.warning} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {t('reels.tutorialBookmarkTitle')}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {t('reels.tutorialBookmarkDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Got It Button */}
          <Pressable
            style={({ pressed }) => [
              styles.gotItButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Got it, close instructions">
            <Text style={[styles.gotItButtonText, { color: colors.textInverse }]}>
              {t('reels.tutorialGotIt')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    gap: Spacing.md,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  gestureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  gestureDirectionColumn: {
    alignItems: 'center',
    width: 100,
    gap: 4,
  },
  gestureIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gestureDirText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  gestureTrack: {
    width: 40,
    height: 90,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  gestureHand: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureDescription: {
    flex: 1,
    gap: 6,
  },
  gestureHint: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  gestureSubHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  featuresList: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  gotItButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  gotItButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
