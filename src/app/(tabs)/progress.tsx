import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { getPerformanceStats } from '@/database/repository';
import { PerformanceStats } from '@/database/types';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';

export default function ProgressScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useLanguage();

  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await getPerformanceStats();
      setStats(data);
    } catch (e) {
      console.warn('Failed to load performance stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const hasHistory = stats && stats.totalAttempts > 0;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Header */}
        <SectionHeader
          title={t('progress.title')}
          subtitle={t('progress.subtitle')}
          rightAction={
            hasHistory ? (
              <Badge
                label={`${stats.accuracyRate}% ${t('progress.accuracyRate')}`}
                variant={stats.accuracyRate >= 60 ? 'success' : 'warning'}
              />
            ) : null
          }
        />

        {!hasHistory ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              iconName="bar-chart-outline"
              title={t('progress.emptyTitle')}
              description={t('progress.emptyDesc')}
              badgeLabel="Zero Attempts"
              badgeVariant="neutral"
            />
            <Pressable
              style={({ pressed }) => [
                styles.startPracticeBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/practice/setup')}>
              <Ionicons name="play" size={16} color={colors.textInverse} />
              <Text style={[styles.startPracticeBtnText, { color: colors.textInverse }]}>
                {t('progress.startNow')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* Primary KPI Grid (4 Metrics) */}
            <View style={styles.kpiGrid}>
              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="documents-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.text }]}>
                  {stats.totalAttempts}
                </Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                  {t('progress.totalAttempted')}
                </Text>
              </Card>

              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.success }]}>
                  {stats.totalCorrect}
                </Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                  {t('progress.correctAnswers')}
                </Text>
              </Card>

              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.error }]}>
                  {stats.totalWrong}
                </Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                  {t('progress.wrongAnswers')}
                </Text>
              </Card>

              <Card style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="pie-chart-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.primaryDark }]}>
                  {stats.accuracyRate}%
                </Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                  {t('progress.accuracyRate')}
                </Text>
              </Card>
            </View>

            {/* Unique Questions & Completed Sessions Cards */}
            <Card style={styles.summaryBarCard}>
              <View style={styles.summaryBarRow}>
                <View style={styles.summaryBarItem}>
                  <Text style={[styles.summaryBarValue, { color: colors.text }]}>
                    {stats.uniqueQuestionsAttempted}
                  </Text>
                  <Text style={[styles.summaryBarLabel, { color: colors.textSecondary }]}>
                    {t('progress.uniqueQuestions')}
                  </Text>
                </View>

                <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

                <View style={styles.summaryBarItem}>
                  <Text style={[styles.summaryBarValue, { color: colors.text }]}>
                    {stats.completedSessionsCount}
                  </Text>
                  <Text style={[styles.summaryBarLabel, { color: colors.textSecondary }]}>
                    {t('progress.completedSessions')}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Daily & Weekly Activity (Requirement 9.B) */}
            <Card style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t('progress.activityTitle')}
                </Text>
              </View>

              <View style={styles.activityItemsRow}>
                <View style={[styles.activityPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Text style={[styles.activityCount, { color: colors.primary }]}>
                    {stats.todayAttempts}
                  </Text>
                  <Text style={[styles.activityPillLabel, { color: colors.textSecondary }]}>
                    Questions Today
                  </Text>
                </View>

                <View style={[styles.activityPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Text style={[styles.activityCount, { color: colors.primary }]}>
                    {stats.thisWeekAttempts}
                  </Text>
                  <Text style={[styles.activityPillLabel, { color: colors.textSecondary }]}>
                    Last 7 Days
                  </Text>
                </View>
              </View>
            </Card>

            {/* Section Breakdown & Weak Areas (Requirement 9.D) */}
            <Card style={styles.sectionCard}>
              <View style={styles.activityHeader}>
                <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t('progress.subjectBreakdown')}
                </Text>
              </View>

              {/* General Ability Bar */}
              <View style={styles.sectionRow}>
                <View style={styles.sectionLabelRow}>
                  <Text style={[styles.sectionName, { color: colors.text }]}>
                    {t('progress.generalAbility')}
                  </Text>
                  <Text style={[styles.sectionScore, { color: colors.textSecondary }]}>
                    {stats.sectionStats.generalAbility.correct} / {stats.sectionStats.generalAbility.attempted} (
                    {stats.sectionStats.generalAbility.accuracy}%)
                  </Text>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, stats.sectionStats.generalAbility.accuracy)}%`,
                        backgroundColor:
                          stats.sectionStats.generalAbility.accuracy >= 60
                            ? colors.success
                            : colors.warning,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Professional Nursing Ability Bar */}
              <View style={styles.sectionRow}>
                <View style={styles.sectionLabelRow}>
                  <Text style={[styles.sectionName, { color: colors.text }]}>
                    {t('progress.professionalAbility')}
                  </Text>
                  <Text style={[styles.sectionScore, { color: colors.textSecondary }]}>
                    {stats.sectionStats.professionalAbility.correct} / {stats.sectionStats.professionalAbility.attempted} (
                    {stats.sectionStats.professionalAbility.accuracy}%)
                  </Text>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, stats.sectionStats.professionalAbility.accuracy)}%`,
                        backgroundColor:
                          stats.sectionStats.professionalAbility.accuracy >= 60
                            ? colors.success
                            : colors.warning,
                      },
                    ]}
                  />
                </View>
              </View>
            </Card>

            {/* Quick Actions to Review and Improve */}
            <View style={styles.reviewActionsGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.reviewActionBtn,
                  { backgroundColor: colors.errorLight, borderColor: colors.error },
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push('/review')}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={[styles.reviewActionBtnText, { color: colors.error }]}>
                  Review Incorrect ({stats.totalWrong})
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.reviewActionBtn,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push('/practice/setup')}>
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                <Text style={[styles.reviewActionBtnText, { color: colors.primaryDark }]}>
                  New Practice Set
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  startPracticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    alignSelf: 'center',
  },
  startPracticeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    gap: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  kpiLabel: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  summaryBarCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  summaryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryBarValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryBarLabel: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 36,
  },
  activityCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    ...Typography.subtitle,
    fontSize: 15,
  },
  activityItemsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  activityPill: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  activityCount: {
    fontSize: 18,
    fontWeight: '800',
  },
  activityPillLabel: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  sectionRow: {
    gap: 4,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionName: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionScore: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  reviewActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reviewActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 6,
  },
  reviewActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
