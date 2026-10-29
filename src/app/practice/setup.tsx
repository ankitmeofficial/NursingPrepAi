import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { BorderRadius, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { getAllPapers } from '@/data/papers';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { getFilteredQuestions } from '@/services/questionService';
import { SectionType } from '@/types/paper';

const PRESET_COUNTS = [10, 20, 30, 50, 100];

export default function PracticeSetupScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const [selectedCount, setSelectedCount] = useState<number>(20);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'nursing_only' | string>('all');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | SectionType>('ALL');

  const papers = useMemo(() => getAllPapers(), []);

  // Compute available pool based on current filters
  const eligibleQuestions = useMemo(() => {
    return getFilteredQuestions({
      nursingOnly: sourceFilter === 'nursing_only',
      paperId: sourceFilter !== 'all' && sourceFilter !== 'nursing_only' ? sourceFilter : undefined,
      section: sectionFilter !== 'ALL' ? sectionFilter : undefined,
    });
  }, [sourceFilter, sectionFilter]);

  const maxAvailable = eligibleQuestions.length;

  const effectiveCount = useMemo(() => {
    if (isCustomSelected) {
      const parsed = parseInt(customCountInput, 10);
      if (isNaN(parsed) || parsed <= 0) return 10;
      return Math.min(parsed, maxAvailable);
    }
    return Math.min(selectedCount, maxAvailable);
  }, [isCustomSelected, customCountInput, selectedCount, maxAvailable]);

  const handleStart = () => {
    if (effectiveCount <= 0) return;

    router.push({
      pathname: '/practice/session',
      params: {
        count: String(effectiveCount),
        sourceFilter,
        sectionFilter,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : 8),
          },
        ]}>
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surfaceMuted },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('practice.setupTitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}>
        {/* Available questions summary pill */}
        <View style={[styles.poolBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMuted }]}>
          <Ionicons name="layers-outline" size={20} color={colors.primary} />
          <View style={styles.poolBannerText}>
            <Text style={[styles.poolBannerTitle, { color: colors.primaryDark }]}>
              {maxAvailable} Questions Available
            </Text>
            <Text style={[styles.poolBannerSubtitle, { color: colors.textSecondary }]}>
              Questions are drawn strictly from verified official source papers.
            </Text>
          </View>
        </View>

        {/* 1. Question Count Selection */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('practice.questionCount')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Choose how many questions to attempt in this session
          </Text>

          <View style={styles.chipsRow}>
            {PRESET_COUNTS.map((count) => {
              const isSelected = !isCustomSelected && selectedCount === count;
              const disabled = count > maxAvailable;

              return (
                <Pressable
                  key={count}
                  disabled={disabled}
                  style={[
                    styles.countChip,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                    disabled && styles.disabledChip,
                  ]}
                  onPress={() => {
                    setIsCustomSelected(false);
                    setSelectedCount(count);
                  }}>
                  <Text
                    style={[
                      styles.countChipText,
                      {
                        color: isSelected
                          ? colors.textInverse
                          : disabled
                          ? colors.textTertiary
                          : colors.text,
                      },
                    ]}>
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Input */}
          <View style={styles.customInputRow}>
            <Pressable
              style={[
                styles.customToggleBtn,
                isCustomSelected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
              onPress={() => setIsCustomSelected(true)}>
              <Text
                style={[
                  styles.customToggleText,
                  { color: isCustomSelected ? colors.textInverse : colors.text },
                ]}>
                {t('practice.customCount')}
              </Text>
            </Pressable>

            {isCustomSelected && (
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.primary,
                    color: colors.text,
                  },
                ]}
                placeholder={`1 – ${maxAvailable}`}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={customCountInput}
                onChangeText={(text) => setCustomCountInput(text.replace(/[^0-9]/g, ''))}
              />
            )}
          </View>
        </Card>

        {/* 2. Source Filter */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('practice.filterBySource')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Target specific posts or practice across all papers
          </Text>

          <View style={styles.filterOptionsCol}>
            <Pressable
              style={[
                styles.filterOptionBtn,
                sourceFilter === 'all'
                  ? { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
              onPress={() => setSourceFilter('all')}>
              <Ionicons
                name="globe-outline"
                size={18}
                color={sourceFilter === 'all' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.filterOptionText, { color: colors.text }]}>
                {t('practice.allEligible')}
              </Text>
              {sourceFilter === 'all' && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </Pressable>

            <Pressable
              style={[
                styles.filterOptionBtn,
                sourceFilter === 'nursing_only'
                  ? { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
              onPress={() => setSourceFilter('nursing_only')}>
              <Ionicons
                name="medkit-outline"
                size={18}
                color={sourceFilter === 'nursing_only' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.filterOptionText, { color: colors.text }]}>
                {t('practice.nursingOnly')}
              </Text>
              {sourceFilter === 'nursing_only' && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </Pressable>

            {papers.map((p) => {
              const isSelected = sourceFilter === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[
                    styles.filterOptionBtn,
                    isSelected
                      ? { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                      : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                  ]}
                  onPress={() => setSourceFilter(p.id)}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.filterOptionText, { color: colors.text }]} numberOfLines={1}>
                    {p.year} • {p.examName} ({p.sessionLabel})
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* 3. Section Filter */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Section Focus
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Practice General Ability or Nursing Professional ability
          </Text>

          <View style={styles.sectionChipsRow}>
            {(['ALL', 'General Ability', 'Professional Ability'] as const).map((sec) => {
              const isSelected = sectionFilter === sec;
              return (
                <Pressable
                  key={sec}
                  style={[
                    styles.sectionChip,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                  ]}
                  onPress={() => setSectionFilter(sec)}>
                  <Text
                    style={[
                      styles.sectionChipText,
                      { color: isSelected ? colors.textInverse : colors.text },
                    ]}>
                    {sec === 'ALL' ? 'Both Sections' : sec}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Start Practice Session Button */}
        <Pressable
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={handleStart}>
          <Ionicons name="play" size={18} color={colors.textInverse} />
          <Text style={[styles.startBtnText, { color: colors.textInverse }]}>
            {t('practice.startSession')} ({effectiveCount} Questions)
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
    marginRight: Spacing.sm,
  },
  backBtnText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.subtitle,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.md,
  },
  poolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  poolBannerText: {
    flex: 1,
  },
  poolBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  poolBannerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  cardTitle: {
    ...Typography.subtitle,
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  countChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 54,
    alignItems: 'center',
  },
  countChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  disabledChip: {
    opacity: 0.4,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customToggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  customToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: 14,
    fontWeight: '600',
  },
  filterOptionsCol: {
    gap: Spacing.xs,
  },
  filterOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sectionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sectionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
