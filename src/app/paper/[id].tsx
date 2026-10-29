import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { BorderRadius, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { getPaperById } from '@/data/papers';
import {
  getAllBookmarks,
  recordAttempt,
  toggleBookmark,
} from '@/database/repository';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { Question, SectionType } from '@/types/paper';

type SectionFilter = 'All' | SectionType;

export default function PaperQuestionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const paper = useMemo(() => {
    return id ? getPaperById(id) : undefined;
  }, [id]);

  const [activeSection, setActiveSection] = useState<SectionFilter>('All');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());

  // Load existing bookmarks
  React.useEffect(() => {
    getAllBookmarks().then((bookmarks) => {
      setBookmarkedSet(new Set(bookmarks.map((b) => b.questionId)));
    });
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!paper) return [];
    if (activeSection === 'All') return paper.questions;
    return paper.questions.filter((q) => q.section === activeSection);
  }, [paper, activeSection]);

  const stats = useMemo(() => {
    if (!paper) return { totalAnswered: 0, correctCount: 0, score: 0 };
    let correct = 0;
    let wrong = 0;
    Object.entries(selectedAnswers).forEach(([qId, selectedIdx]) => {
      const q = paper.questions.find((item) => item.id === qId);
      if (q) {
        if (selectedIdx === q.correctOptionIndex) {
          correct += 1;
        } else {
          wrong += 1;
        }
      }
    });
    const totalAnswered = correct + wrong;
    const score = Math.max(0, correct * 1 - wrong * 0.33);
    return { totalAnswered, correctCount: correct, score: Number(score.toFixed(2)) };
  }, [paper, selectedAnswers]);

  const handleSelectOption = async (question: Question, optionIndex: number) => {
    if (selectedAnswers[question.id] !== undefined) return;

    const isCorrect = optionIndex === question.correctOptionIndex;

    setSelectedAnswers((prev) => ({
      ...prev,
      [question.id]: optionIndex,
    }));

    // Record persistent attempt in SQLite/AsyncStorage
    await recordAttempt({
      questionId: question.id,
      paperId: paper?.id || (typeof id === 'string' ? id : 'unknown'),
      section: question.section,
      selectedOptionIndex: optionIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect,
      timestamp: Date.now(),
      mode: 'paper',
    });
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

  const toggleRevealAnswer = (questionId: string) => {
    setRevealedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setRevealedQuestions({});
    setShowAllAnswers(false);
  };

  if (!paper) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.surfaceMuted }]}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.centeredContent}>
          <EmptyState
            iconName="alert-circle-outline"
            title="Question Paper Not Found"
            description="The requested previous-year question paper could not be found or has not been processed."
            badgeLabel="Invalid Paper"
            badgeVariant="error"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : 8),
          },
        ]}>
        <View style={styles.headerTopRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Papers</Text>
          </Pressable>

          <View style={styles.headerTitleWrapper}>
            <Text style={[styles.headerYearBadge, { color: colors.primary }]}>
              {paper.year} EXAM PAPER
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {paper.examName}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={handleReset}>
            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Paper Subtitle & Stats Bar */}
        <View style={styles.metaRow}>
          <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
            {paper.sessionLabel} • {paper.examDate}
          </Text>
          <View style={styles.statsPill}>
            <Text style={[styles.statsPillText, { color: colors.primaryDark }]}>
              {stats.totalAnswered}/{paper.totalQuestions} Answered • Score: {stats.score}
            </Text>
          </View>
        </View>

        {/* Section Filters */}
        <View style={styles.sectionTabsRow}>
          <Pressable
            style={[
              styles.sectionTab,
              activeSection === 'All'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
            onPress={() => setActiveSection('All')}>
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSection === 'All' ? colors.textInverse : colors.textSecondary },
              ]}>
              All ({paper.totalQuestions})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.sectionTab,
              activeSection === 'General Ability'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
            onPress={() => setActiveSection('General Ability')}>
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSection === 'General Ability' ? colors.textInverse : colors.textSecondary },
              ]}>
              General Ability ({paper.generalAbilityCount})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.sectionTab,
              activeSection === 'Professional Ability'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
            onPress={() => setActiveSection('Professional Ability')}>
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSection === 'Professional Ability' ? colors.textInverse : colors.textSecondary },
              ]}>
              Professional ({paper.professionalAbilityCount})
            </Text>
          </Pressable>
        </View>

        {/* Quick Toggles */}
        <View style={styles.togglesBar}>
          <Pressable
            style={[
              styles.toggleButton,
              {
                backgroundColor: showAllAnswers ? colors.primaryLight : colors.surfaceMuted,
                borderColor: showAllAnswers ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowAllAnswers((prev) => !prev)}>
            <Ionicons
              name={showAllAnswers ? 'eye' : 'eye-off-outline'}
              size={14}
              color={showAllAnswers ? colors.primaryDark : colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleButtonText,
                { color: showAllAnswers ? colors.primaryDark : colors.textSecondary },
              ]}>
              {showAllAnswers ? 'Hide All Answer Keys' : 'Show All Answer Keys'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Questions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}>
        {filteredQuestions.map((q) => {
          const selectedOption = selectedAnswers[q.id];
          const isAnswered = selectedOption !== undefined;
          const isRevealed = showAllAnswers || revealedQuestions[q.id] || isAnswered;

          return (
            <Card key={q.id} style={styles.questionCard}>
              {/* Question Header */}
              <View style={styles.questionTopRow}>
                <View style={styles.qNumBadge}>
                  <Text style={[styles.qNumText, { color: colors.primary }]}>
                    Q.{q.questionNumber}
                  </Text>
                </View>

                <View style={styles.questionMetaBadges}>
                  <Badge
                    label={q.section === 'General Ability' ? 'GA' : 'NURSING / PROF'}
                    variant={q.section === 'General Ability' ? 'neutral' : 'primary'}
                  />
                  <Badge label="+1 / −0.33 Mark" variant="neutral" />

                  <Pressable
                    style={({ pressed }) => [
                      styles.bookmarkIconBtn,
                      { backgroundColor: bookmarkedSet.has(q.id) ? colors.primaryLight : colors.surfaceMuted },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleToggleBookmark(q.id)}>
                    <Ionicons
                      name={bookmarkedSet.has(q.id) ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={bookmarkedSet.has(q.id) ? colors.primary : colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Question Text */}
              <Text style={[styles.questionText, { color: colors.text }]}>
                {q.text}
              </Text>

              {/* 4 Options */}
              <View style={styles.optionsList}>
                {q.options.map((optionText, optIndex) => {
                  const isSelected = selectedOption === optIndex;
                  const isCorrect = optIndex === q.correctOptionIndex;

                  let optionBorderColor = colors.border;
                  let optionBgColor = colors.surfaceMuted;
                  let iconElement: React.ReactNode = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      optionBorderColor = colors.success;
                      optionBgColor = colors.successLight;
                      iconElement = (
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      );
                    } else if (isSelected) {
                      optionBorderColor = colors.error;
                      optionBgColor = colors.errorLight;
                      iconElement = (
                        <Ionicons name="close-circle" size={18} color={colors.error} />
                      );
                    }
                  } else if (isRevealed && isCorrect) {
                    optionBorderColor = colors.success;
                    optionBgColor = colors.successLight;
                    iconElement = (
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                    );
                  }

                  const optionLabel = `(${optIndex + 1})`;

                  return (
                    <Pressable
                      key={optIndex}
                      style={({ pressed }) => [
                        styles.optionRow,
                        {
                          backgroundColor: optionBgColor,
                          borderColor: optionBorderColor,
                        },
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleSelectOption(q, optIndex)}>
                      <Text style={[styles.optionLabel, { color: colors.primary }]}>
                        {optionLabel}
                      </Text>
                      <Text style={[styles.optionText, { color: colors.text }]}>
                        {optionText}
                      </Text>
                      {iconElement}
                    </Pressable>
                  );
                })}
              </View>

              {/* Answer Key / Explanation Bar */}
              <View style={styles.questionFooter}>
                <Pressable
                  style={styles.revealButton}
                  onPress={() => toggleRevealAnswer(q.id)}>
                  <Ionicons
                    name={isRevealed ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.revealButtonText, { color: colors.primary }]}>
                    {isRevealed ? 'Hide Source Answer' : 'View Source Answer'}
                  </Text>
                </Pressable>

                {isRevealed && (
                  <View style={[styles.answerBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                    <View style={styles.answerHeader}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[styles.answerHeaderText, { color: colors.success }]}>
                        Source Verified Correct Answer: Option ({q.correctOptionIndex + 1})
                      </Text>
                    </View>
                    <Text style={[styles.answerBodyText, { color: colors.text }]}>
                      {q.options[q.correctOptionIndex]}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
    marginRight: Spacing.sm,
  },
  backText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  headerTitleWrapper: {
    flex: 1,
  },
  headerYearBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...Typography.subtitle,
    fontSize: 15,
  },
  resetButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
    gap: 4,
  },
  sessionText: {
    ...Typography.caption,
    fontSize: 11,
  },
  statsPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statsPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTabsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sectionTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  sectionTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  togglesBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  toggleButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  questionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  questionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  qNumBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  qNumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  questionMetaBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  questionText: {
    ...Typography.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
    marginVertical: Spacing.xs,
  },
  optionsList: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 40,
  },
  optionLabel: {
    fontWeight: '700',
    fontSize: 13,
    marginRight: Spacing.sm,
    minWidth: 24,
  },
  optionText: {
    ...Typography.body,
    fontSize: 13,
    flex: 1,
  },
  questionFooter: {
    marginTop: Spacing.sm,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  revealButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  answerBox: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  answerHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  answerBodyText: {
    ...Typography.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  bookmarkIconBtn: {
    padding: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
