import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { ThemeMode, useThemeContext } from '@/context/ThemeContext';
import { clearAllUserData, getAllAttempts, getAllBookmarks } from '@/database/repository';
import { FontSizeLevel, FONT_SIZE_CONFIGS, ORDERED_FONT_LEVELS, useFontSize } from '@/hooks/use-font-size';
import { AppLanguage, useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const colors = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage, t } = useLanguage();
  const {
    fontSizeLevel,
    fontSizeScale,
    setFontSizeLevel,
    increaseFontSize,
    decreaseFontSize,
    canIncrease,
    canDecrease,
    scaleFont,
  } = useFontSize();

  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const loadDataStats = async () => {
    try {
      const attempts = await getAllAttempts();
      const bookmarks = await getAllBookmarks();
      setAttemptCount(attempts.length);
      setBookmarkCount(bookmarks.length);
    } catch {}
  };

  useEffect(() => {
    loadDataStats();
  }, []);

  const handleResetData = () => {
    const title = t('settings.resetConfirmTitle');
    const desc = t('settings.resetConfirmDesc');

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${desc}`);
      if (confirmed) {
        performReset();
      }
    } else {
      Alert.alert(title, desc, [
        { text: t('practice.cancel'), style: 'cancel' },
        { text: t('practice.confirm'), style: 'destructive', onPress: performReset },
      ]);
    }
  };

  const performReset = async () => {
    await clearAllUserData();
    await loadDataStats();
    setResetSuccessMessage(t('settings.resetSuccess'));
    setTimeout(() => setResetSuccessMessage(null), 3500);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}>
        <SectionHeader
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
        />

        {/* 1. Language Preferences */}
        <Card style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="language" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.language')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Select interface language
              </Text>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <Pressable
              style={[
                styles.selectableOption,
                language === 'en'
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
              onPress={() => setLanguage('en')}>
              <Text
                style={[
                  styles.optionText,
                  { color: language === 'en' ? colors.textInverse : colors.text },
                ]}>
                {t('settings.english')}
              </Text>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.textInverse} />
              )}
            </Pressable>

            <Pressable
              style={[
                styles.selectableOption,
                language === 'hi'
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
              onPress={() => setLanguage('hi')}>
              <Text
                style={[
                  styles.optionText,
                  { color: language === 'hi' ? colors.textInverse : colors.text },
                ]}>
                {t('settings.hindi')}
              </Text>
              {language === 'hi' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.textInverse} />
              )}
            </Pressable>
          </View>
        </Card>

        {/* 2. Theme Preferences */}
        <Card style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.theme')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Choose your preferred visual appearance
              </Text>
            </View>
          </View>

          <View style={styles.themeOptionsGrid}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => {
              const isSelected = themeMode === mode;
              const modeLabel =
                mode === 'system'
                  ? t('settings.systemTheme')
                  : mode === 'light'
                  ? t('settings.lightTheme')
                  : t('settings.darkTheme');

              const modeIcon =
                mode === 'system'
                  ? 'phone-portrait-outline'
                  : mode === 'light'
                  ? 'sunny-outline'
                  : 'moon-outline';

              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.themeOptionPill,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                  ]}
                  onPress={() => setThemeMode(mode)}>
                  <Ionicons
                    name={modeIcon as any}
                    size={16}
                    color={isSelected ? colors.textInverse : colors.primary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? colors.textInverse : colors.text },
                    ]}>
                    {modeLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* 3. Font Size Controls (Increase / Decrease) */}
        <Card style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="text-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.fontSize')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {t('settings.fontSizeSubtitle')}
              </Text>
            </View>
          </View>

          {/* Stepper controls */}
          <View style={styles.fontStepperRow}>
            <Pressable
              disabled={!canDecrease}
              style={({ pressed }) => [
                styles.stepperBtn,
                {
                  backgroundColor: canDecrease ? colors.surfaceMuted : colors.backgroundElement,
                  borderColor: canDecrease ? colors.border : colors.borderLight,
                  opacity: canDecrease ? (pressed ? 0.75 : 1) : 0.4,
                },
              ]}
              onPress={decreaseFontSize}
              accessibilityLabel="Decrease font size">
              <Ionicons
                name="remove-outline"
                size={18}
                color={canDecrease ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.stepperBtnLabel,
                  { color: canDecrease ? colors.text : colors.textTertiary },
                ]}>
                A-
              </Text>
            </Pressable>

            <View
              style={[
                styles.fontCurrentPill,
                { backgroundColor: colors.primaryLight, borderColor: colors.primaryMuted },
              ]}>
              <Text style={[styles.fontCurrentScale, { color: colors.primaryDark }]}>
                {Math.round(fontSizeScale * 100)}%
              </Text>
              <Text style={[styles.fontCurrentLabel, { color: colors.primaryDark }]}>
                {fontSizeLevel === 'small'
                  ? t('settings.fontSmall')
                  : fontSizeLevel === 'medium'
                  ? t('settings.fontMedium')
                  : fontSizeLevel === 'large'
                  ? t('settings.fontLarge')
                  : t('settings.fontXLarge')}
              </Text>
            </View>

            <Pressable
              disabled={!canIncrease}
              style={({ pressed }) => [
                styles.stepperBtn,
                {
                  backgroundColor: canIncrease ? colors.surfaceMuted : colors.backgroundElement,
                  borderColor: canIncrease ? colors.border : colors.borderLight,
                  opacity: canIncrease ? (pressed ? 0.75 : 1) : 0.4,
                },
              ]}
              onPress={increaseFontSize}
              accessibilityLabel="Increase font size">
              <Text
                style={[
                  styles.stepperBtnLabel,
                  { color: canIncrease ? colors.text : colors.textTertiary, fontSize: 16 },
                ]}>
                A+
              </Text>
              <Ionicons
                name="add-outline"
                size={18}
                color={canIncrease ? colors.primary : colors.textTertiary}
              />
            </Pressable>
          </View>

          {/* Quick Preset Selector Grid */}
          <View style={styles.fontSizeGrid}>
            {ORDERED_FONT_LEVELS.map((level) => {
              const isSelected = fontSizeLevel === level;
              const config = FONT_SIZE_CONFIGS[level];
              const levelLabel =
                level === 'small'
                  ? t('settings.fontSmall')
                  : level === 'medium'
                  ? t('settings.fontMedium')
                  : level === 'large'
                  ? t('settings.fontLarge')
                  : t('settings.fontXLarge');

              return (
                <Pressable
                  key={level}
                  style={[
                    styles.fontSizePill,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                  ]}
                  onPress={() => setFontSizeLevel(level)}>
                  <Text
                    style={[
                      styles.fontSizePillText,
                      { color: isSelected ? colors.textInverse : colors.text },
                    ]}>
                    {levelLabel}
                  </Text>
                  <Text
                    style={[
                      styles.fontSizePillSub,
                      {
                        color: isSelected ? colors.textInverse : colors.textSecondary,
                        opacity: isSelected ? 0.9 : 0.8,
                      },
                    ]}>
                    {Math.round(config.scale * 100)}%
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Interactive Live Reading Preview */}
          <View
            style={[
              styles.previewBox,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}>
            <View style={styles.previewHeaderRow}>
              <View style={[styles.previewDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.previewHeaderLabel, { color: colors.primary }]}>
                {t('settings.fontPreview')}
              </Text>
            </View>
            <Text
              style={[
                styles.previewQuestionText,
                {
                  color: colors.text,
                  fontSize: scaleFont(14.5),
                  lineHeight: scaleFont(21),
                },
              ]}>
              {t('settings.sampleQuestion')}
            </Text>
            <Text
              style={[
                styles.previewAnswerText,
                {
                  color: colors.textSecondary,
                  fontSize: scaleFont(12.5),
                  lineHeight: scaleFont(18),
                },
              ]}>
              {t('settings.sampleAnswer')}
            </Text>
          </View>
        </Card>

        {/* 4. Storage & Data Management */}
        <Card style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="server-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.dataTitle')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Local SQLite & AsyncStorage storage
              </Text>
            </View>
          </View>

          <View style={styles.dataStatsRow}>
            <View style={[styles.dataStatItem, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.dataStatValue, { color: colors.text }]}>
                {attemptCount}
              </Text>
              <Text style={[styles.dataStatLabel, { color: colors.textSecondary }]}>
                Recorded Attempts
              </Text>
            </View>

            <View style={[styles.dataStatItem, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.dataStatValue, { color: colors.text }]}>
                {bookmarkCount}
              </Text>
              <Text style={[styles.dataStatLabel, { color: colors.textSecondary }]}>
                Saved Questions
              </Text>
            </View>
          </View>

          {resetSuccessMessage && (
            <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.successBannerText, { color: colors.success }]}>
                {resetSuccessMessage}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.resetBtn,
              { backgroundColor: colors.errorLight, borderColor: colors.error },
              pressed && styles.pressed,
            ]}
            onPress={handleResetData}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.resetBtnText, { color: colors.error }]}>
              {t('settings.resetData')}
            </Text>
          </Pressable>
        </Card>

        {/* 4. About & Syllabus Information (Requirement 10.C) */}
        <Card style={styles.settingsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.aboutTitle')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {t('settings.version')}
              </Text>
            </View>
          </View>

          <View style={[styles.infoCallout, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.infoCalloutText, { color: colors.text }]}>
              {t('settings.examInfo')}
            </Text>
            <View style={styles.tagWrap}>
              <Badge label="100 MCQs CBT" variant="primary" />
              <Badge label="30 GA + 70 Professional" variant="neutral" />
              <Badge label="+1 / −0.33 Mark" variant="warning" />
            </View>
            <Text style={[styles.offlineText, { color: colors.textTertiary }]}>
              {t('settings.offlineNotice')}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  settingsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.subtitle,
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  selectableOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  themeOptionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 5,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dataStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dataStatItem: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dataStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  dataStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCallout: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  infoCalloutText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  offlineText: {
    fontSize: 11,
    marginTop: 4,
  },
  fontStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  stepperBtnLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  fontCurrentPill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 84,
  },
  fontCurrentScale: {
    fontSize: 15,
    fontWeight: '800',
  },
  fontCurrentLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  fontSizeGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  fontSizePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fontSizePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fontSizePillSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  previewBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewQuestionText: {
    fontWeight: '600',
  },
  previewAnswerText: {
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
  },
});
