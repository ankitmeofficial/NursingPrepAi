import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import {
  getAllBookmarks,
  recordAttempt,
  savePracticeSession,
  toggleBookmark,
} from '@/database/repository';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { getRandomQuestions } from '@/services/questionService';
import { Question, SectionType } from '@/types/paper';

export default function PracticeSessionScreen() {
  const params = useLocalSearchParams<{
    count?: string;
    sourceFilter?: string;
    sectionFilter?: string;
  }>();

  const count = parseInt(params.count || '20', 10);
  const sourceFilter = params.sourceFilter || 'all';
  const sectionFilter = (params.sectionFilter || 'ALL') as 'ALL' | SectionType;

  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(count * 60); // 1 min per Q
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  // Fetch randomized questions once on mount
  useEffect(() => {
    const { questions: fetched } = getRandomQuestions(count, {
      nursingOnly: sourceFilter === 'nursing_only',
      paperId: sourceFilter !== 'all' && sourceFilter !== 'nursing_only' ? sourceFilter : undefined,
      section: sectionFilter !== 'ALL' ? sectionFilter : undefined,
    });
    setQuestions(fetched);
    setSecondsRemaining(fetched.length * 60);

    getAllBookmarks().then((bookmarks) => {
      setBookmarkedSet(new Set(bookmarks.map((b) => b.questionId)));
    });
  }, [count, sourceFilter, sectionFilter]);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleToggleBookmark = async (questionId: string) => {
    const isSaved = await toggleBookmark(questionId);
    setBookmarkedSet((prev) => {
      const next = new Set(prev);
      if (isSaved) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  };

  const handlePromptSubmit = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const title = t('practice.submitConfirmTitle');
    const desc = t('practice.submitConfirmDesc', {
      answered: answeredCount,
      total: questions.length,
    });

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${desc}`);
      if (confirmed) {
        handleFinalSubmit();
      }
    } else {
      Alert.alert(title, desc, [
        { text: t('practice.cancel'), style: 'cancel' },
        { text: t('practice.confirm'), style: 'default', onPress: handleFinalSubmit },
      ]);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || questions.length === 0) return;
    setIsSubmitting(true);

    const endTime = Date.now();
    let correctCount = 0;
    let wrongCount = 0;

    // Record each question attempt into persistent database
    for (const q of questions) {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined) {
        const isCorrect = selected === q.correctOptionIndex;
        if (isCorrect) correctCount += 1;
        else wrongCount += 1;

        await recordAttempt({
          questionId: q.id,
          paperId: q.paperId || 'practice_pool',
          section: q.section,
          selectedOptionIndex: selected,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect,
          timestamp: endTime,
          sessionId: sessionIdRef.current,
          mode: 'practice',
        });
      }
    }

    const score = Number(Math.max(0, correctCount * 1 - wrongCount * 0.33).toFixed(2));

    // Save session summary
    await savePracticeSession({
      id: sessionIdRef.current,
      startTime: startTimeRef.current,
      endTime,
      totalQuestions: questions.length,
      attemptedCount: Object.keys(selectedAnswers).length,
      correctCount,
      wrongCount,
      score,
      sourceFilter,
    });

    // Navigate to results screen
    router.replace({
      pathname: '/practice/results',
      params: {
        total: String(questions.length),
        correct: String(correctCount),
        wrong: String(wrongCount),
        score: String(score),
        timeSpentSeconds: String(Math.round((endTime - startTimeRef.current) / 1000)),
        questionIds: JSON.stringify(questions.map((q) => q.id)),
        userAnswers: JSON.stringify(selectedAnswers),
      },
    });
  };

  // Format timer MM:SS
  const timerDisplay = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [secondsRemaining]);

  if (!currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  const selectedForCurrent = selectedAnswers[currentQuestion.id];
  const isBookmarked = bookmarkedSet.has(currentQuestion.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Progress and Timer */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : 8),
          },
        ]}>
        <View style={styles.headerTopRow}>
          <Pressable
            style={({ pressed }) => [
              styles.exitBtn,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}>
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {t('practice.question', {
                current: currentIndex + 1,
                total: questions.length,
              })}
            </Text>
          </View>

          {/* Timer Display */}
          <View style={[styles.timerPill, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={[styles.timerText, { color: colors.primaryDark }]}>
              {timerDisplay}
            </Text>
          </View>
        </View>

        {/* Progress Bar Line */}
        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceMuted }]}>
          <View
            style={[
              styles.progressBarActive,
              {
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Main Question Card Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}>
        <Card style={styles.questionCard}>
          {/* Question Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadges}>
              <Badge
                label={currentQuestion.section === 'General Ability' ? 'GA' : 'NURSING'}
                variant={currentQuestion.section === 'General Ability' ? 'neutral' : 'primary'}
              />
              <Badge label="+1 / −0.33 Mark" variant="neutral" />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.bookmarkBtn,
                { backgroundColor: isBookmarked ? colors.primaryLight : colors.surfaceMuted },
                pressed && styles.pressed,
              ]}
              onPress={() => handleToggleBookmark(currentQuestion.id)}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? colors.primary : colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* Question Text */}
          <Text style={[styles.questionText, { color: colors.text }]}>
            {currentQuestion.text}
          </Text>

          {/* 4 Options */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((optionText, optIndex) => {
              const isSelected = selectedForCurrent === optIndex;

              return (
                <Pressable
                  key={optIndex}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surfaceMuted,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleSelectOption(currentQuestion.id, optIndex)}>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.textTertiary,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color={colors.textInverse} />
                    )}
                  </View>
                  <Text style={[styles.optionLabel, { color: colors.primary }]}>
                    ({optIndex + 1})
                  </Text>
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {optionText}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <Pressable
          disabled={currentIndex === 0}
          style={[
            styles.navBtn,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            currentIndex === 0 && styles.disabledNavBtn,
          ]}
          onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>
            {t('practice.prev')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.submitSessionBtn,
            { backgroundColor: colors.success },
            pressed && styles.pressed,
          ]}
          onPress={handlePromptSubmit}>
          <Ionicons name="checkmark-done" size={16} color={colors.textInverse} />
          <Text style={[styles.submitSessionBtnText, { color: colors.textInverse }]}>
            {t('practice.submit')}
          </Text>
        </Pressable>

        <Pressable
          disabled={currentIndex === questions.length - 1}
          style={[
            styles.navBtn,
            { backgroundColor: colors.primary, borderColor: colors.primary },
            currentIndex === questions.length - 1 && styles.disabledNavBtn,
          ]}
          onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}>
          <Text style={[styles.navBtnText, { color: colors.textInverse }]}>
            {t('practice.next')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exitBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarActive: {
    height: '100%',
    borderRadius: 2,
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
  },
  questionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  bookmarkBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    ...Typography.bodyMedium,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    marginVertical: Spacing.xs,
  },
  optionsList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minHeight: 48,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  optionLabel: {
    fontWeight: '700',
    fontSize: 13,
    marginRight: Spacing.xs,
  },
  optionText: {
    ...Typography.body,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabledNavBtn: {
    opacity: 0.35,
  },
  submitSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  submitSessionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
