import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { BorderRadius, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { getQuestionsByIds } from '@/services/questionService';

export default function PracticeResultsScreen() {
  const params = useLocalSearchParams<{
    total?: string;
    correct?: string;
    wrong?: string;
    score?: string;
    timeSpentSeconds?: string;
    questionIds?: string;
    userAnswers?: string;
  }>();

  const total = parseInt(params.total || '0', 10);
  const correct = parseInt(params.correct || '0', 10);
  const wrong = parseInt(params.wrong || '0', 10);
  const score = parseFloat(params.score || '0');
  const timeSpentSecs = parseInt(params.timeSpentSeconds || '0', 10);

  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const userAnswers: Record<string, number> = useMemo(() => {
    try {
      return params.userAnswers ? JSON.parse(params.userAnswers) : {};
    } catch {
      return {};
    }
  }, [params.userAnswers]);

  const questions = useMemo(() => {
    try {
      const ids: string[] = params.questionIds ? JSON.parse(params.questionIds) : [];
      return getQuestionsByIds(ids);
    } catch {
      return [];
    }
  }, [params.questionIds]);

  const answeredCount = correct + wrong;
  const unansweredCount = Math.max(0, total - answeredCount);
  const accuracyRate = answeredCount > 0 ? Math.round((correct / answeredCount) * 100) : 0;

  const timeFormatted = useMemo(() => {
    const mins = Math.floor(timeSpentSecs / 60);
    const secs = timeSpentSecs % 60;
    return `${mins}m ${secs}s`;
  }, [timeSpentSecs]);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('practice.resultsTitle')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}>
        {/* Score Card Banner */}
        <Card style={[styles.scoreHeroCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMuted }]}>
          <Text style={[styles.scoreBannerLabel, { color: colors.primaryDark }]}>
            {t('practice.score')}
          </Text>
          <Text style={[styles.scoreBigNumber, { color: colors.primaryDark }]}>
            {score}
          </Text>
          <Text style={[styles.scoreSubtext, { color: colors.textSecondary }]}>
            Marking Scheme: +1 Correct, −0.33 Wrong • Time: {timeFormatted}
          </Text>
        </Card>

        {/* 4 Performance Pills */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              {correct}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('practice.correct')}
            </Text>
          </View>

          <View style={[styles.metricPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.error }]}>
              {wrong}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('practice.wrong')}
            </Text>
          </View>

          <View style={[styles.metricPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.textSecondary }]}>
              {unansweredCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('practice.unanswered')}
            </Text>
          </View>

          <View style={[styles.metricPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.primaryDark }]}>
              {accuracyRate}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('practice.accuracy')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCol}>
          {wrong > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.errorLight, borderColor: colors.error },
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/review')}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>
                {t('practice.reviewMistakes')} ({wrong})
              </Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary, borderColor: colors.primary },
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace('/practice/setup')}>
            <Ionicons name="refresh" size={18} color={colors.textInverse} />
            <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>
              {t('practice.practiceAgain')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="home-outline" size={18} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>
              {t('practice.backHome')}
            </Text>
          </Pressable>
        </View>

        {/* Question-By-Question Detailed Breakdown */}
        <Text style={[styles.breakdownHeaderTitle, { color: colors.text }]}>
          Question Breakdown ({questions.length})
        </Text>

        <View style={styles.questionsBreakdownList}>
          {questions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isAnswered = userChoice !== undefined;
            const isCorrect = userChoice === q.correctOptionIndex;

            return (
              <Card key={q.id} style={styles.breakdownCard}>
                <View style={styles.breakdownTopRow}>
                  <Text style={[styles.breakdownQNum, { color: colors.primary }]}>
                    #{idx + 1}
                  </Text>
                  <Badge
                    label={
                      !isAnswered
                        ? 'UNANSWERED'
                        : isCorrect
                        ? 'CORRECT (+1)'
                        : 'INCORRECT (-0.33)'
                    }
                    variant={!isAnswered ? 'neutral' : isCorrect ? 'success' : 'error'}
                  />
                </View>

                <Text style={[styles.breakdownQText, { color: colors.text }]}>
                  {q.text}
                </Text>

                <View style={styles.answerComparisonBox}>
                  {isAnswered && !isCorrect && (
                    <Text style={[styles.comparisonText, { color: colors.error }]}>
                      Your Choice: ({userChoice + 1}) {q.options[userChoice]}
                    </Text>
                  )}
                  <Text style={[styles.comparisonText, { color: colors.success }]}>
                    Correct Answer: ({q.correctOptionIndex + 1}) {q.options[q.correctOptionIndex]}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    alignItems: 'center',
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
  scoreHeroCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  scoreBannerLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreBigNumber: {
    fontSize: 48,
    fontWeight: '900',
    marginVertical: Spacing.xs,
  },
  scoreSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metricPill: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsCol: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownHeaderTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  questionsBreakdownList: {
    gap: Spacing.sm,
  },
  breakdownCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  breakdownTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownQNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  breakdownQText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginTop: 2,
  },
  answerComparisonBox: {
    marginTop: Spacing.xs,
    gap: 2,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
