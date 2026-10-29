import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useFontSize } from '@/hooks/use-font-size';
import { useLanguage } from '@/hooks/use-language';
import { useThemeInfo } from '@/hooks/use-theme';
import { Question } from '@/types/paper';

interface ReelCardProps {
  question: Question;
  cardHeight: number;
  isBookmarked: boolean;
  onToggleBookmark: (questionId: string) => void;
  onAnswerSelected: (question: Question, optionIndex: number) => void;
  onNextQuestion: () => void;
  initialSelectedOption?: number;
}

export const ReelCard = React.memo(function ReelCard({
  question,
  cardHeight,
  isBookmarked,
  onToggleBookmark,
  onAnswerSelected,
  onNextQuestion,
  initialSelectedOption,
}: ReelCardProps) {
  const { isDark, colors } = useThemeInfo();
  const { t } = useLanguage();
  const { scaleFont } = useFontSize();

  const [selectedOption, setSelectedOption] = useState<number | undefined>(
    initialSelectedOption
  );

  // Animations
  const [bookmarkScale] = useState(() => new Animated.Value(1));
  const [feedbackFade] = useState(() => new Animated.Value(0));
  const [feedbackTranslateY] = useState(() => new Animated.Value(10));

  // Options scale animations for subtle micro-interactions
  const [optionScales] = useState(() => [
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  const isAnswered = selectedOption !== undefined;
  const isCorrect = isAnswered && selectedOption === question.correctOptionIndex;

  useEffect(() => {
    if (initialSelectedOption !== undefined) {
      setSelectedOption(initialSelectedOption);
      feedbackFade.setValue(1);
      feedbackTranslateY.setValue(0);
    }
  }, [initialSelectedOption, feedbackFade, feedbackTranslateY]);

  const handlePressOption = (optIdx: number) => {
    if (isAnswered) return; // Prevent double submissions

    // Option press animation
    Animated.sequence([
      Animated.timing(optionScales[optIdx], {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(optionScales[optIdx], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedOption(optIdx);
    onAnswerSelected(question, optIdx);

    // Animate feedback appearance
    Animated.parallel([
      Animated.timing(feedbackFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(feedbackTranslateY, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBookmarkPress = () => {
    Animated.sequence([
      Animated.timing(bookmarkScale, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(bookmarkScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleBookmark(question.id);
  };

  return (
    <View style={[styles.cardOuter, { height: cardHeight }]}>
      <Card style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.badgesWrapper}>
            <Badge
              label={question.section === 'General Ability' ? 'GA' : 'NURSING'}
              variant={question.section === 'General Ability' ? 'neutral' : 'primary'}
            />
            <Text style={[styles.examYearText, { color: colors.textSecondary }]}>
              {question.year ? `${question.year} • ` : ''}{question.examName || 'RRB Exam'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.bookmarkBtn,
              { backgroundColor: isBookmarked ? colors.primaryLight : colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={handleBookmarkPress}
            hitSlop={8}
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Save question'}>
            <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? colors.primary : colors.textSecondary}
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Question Text */}
        <View style={styles.questionContainer}>
          <ScrollView
            style={styles.questionScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            <Text
              style={[
                styles.questionText,
                {
                  color: colors.text,
                  fontSize: scaleFont(15),
                  lineHeight: scaleFont(23),
                },
              ]}>
              {question.text}
            </Text>
          </ScrollView>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {question.options.map((optText, optIdx) => {
            const isThisSelected = selectedOption === optIdx;
            const isThisCorrect = optIdx === question.correctOptionIndex;

            let bgColor = colors.surfaceMuted;
            let borderColor = colors.border;
            let iconElement: React.ReactNode = null;

            if (isAnswered) {
              if (isThisCorrect) {
                bgColor = colors.successLight;
                borderColor = colors.success;
                iconElement = (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                );
              } else if (isThisSelected) {
                bgColor = colors.errorLight;
                borderColor = colors.error;
                iconElement = (
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                );
              }
            }

            return (
              <Animated.View
                key={optIdx}
                style={{ transform: [{ scale: optionScales[optIdx] }] }}>
                <Pressable
                  disabled={isAnswered}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      backgroundColor: bgColor,
                      borderColor,
                    },
                    pressed && !isAnswered && styles.pressed,
                  ]}
                  onPress={() => handlePressOption(optIdx)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isThisSelected }}>
                  <View
                    style={[
                      styles.optIndexCircle,
                      {
                        backgroundColor: isThisSelected
                          ? isThisCorrect
                          ? colors.success
                          : colors.error
                          : colors.card,
                        borderColor: isThisSelected
                          ? isThisCorrect
                          ? colors.success
                          : colors.error
                          : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.optIndexText,
                        {
                          color: isThisSelected ? colors.textInverse : colors.primary,
                        },
                      ]}>
                      {optIdx + 1}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: colors.text,
                        fontWeight: isThisSelected || (isAnswered && isThisCorrect) ? '600' : '400',
                        fontSize: scaleFont(13),
                        lineHeight: scaleFont(18),
                      },
                    ]}>
                    {optText}
                  </Text>

                  {iconElement}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Answer Feedback & Explanation Box */}
        {isAnswered && (
          <Animated.View
            style={[
              styles.feedbackContainer,
              {
                opacity: feedbackFade,
                transform: [{ translateY: feedbackTranslateY }],
                backgroundColor: isCorrect ? colors.successLight : colors.errorLight,
                borderColor: isCorrect ? colors.success : colors.error,
              },
            ]}>
            {/* Feedback Header: Status Badges */}
            <View style={styles.feedbackHeaderRow}>
              {isCorrect ? (
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isDark ? 'rgba(130, 178, 139, 0.18)' : '#FFFFFF',
                      borderColor: colors.success,
                    },
                  ]}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={[styles.statusPillText, { color: colors.success }]}>
                    Correct! (+1 Mark)
                  </Text>
                </View>
              ) : (
                <>
                  {/* 1. Incorrect (-0.33) in Red */}
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.18)' : '#FFFFFF',
                        borderColor: colors.error,
                      },
                    ]}>
                    <Ionicons name="close-circle" size={13} color={colors.error} />
                    <Text style={[styles.statusPillText, { color: colors.error }]}>
                      Incorrect (-0.33)
                    </Text>
                  </View>

                  {/* 2. Correct Answer Option in Green/Highlight */}
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isDark ? 'rgba(130, 178, 139, 0.18)' : '#FFFFFF',
                        borderColor: colors.success,
                      },
                    ]}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                    <Text style={[styles.statusPillText, { color: colors.success }]}>
                      Correct: Option ({question.correctOptionIndex + 1})
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* 3. Explanation Section in Distinct Light Color Card */}
            <View
              style={[
                styles.explanationCard,
                {
                  backgroundColor: isDark ? '#353032' : '#FFFFFF',
                  borderColor: isDark ? '#464041' : '#F0E5D8',
                },
              ]}>
              <View style={styles.explanationHeaderRow}>
                <Ionicons
                  name="bulb-outline"
                  size={12}
                  color={isCorrect ? colors.success : colors.primary}
                />
                <Text
                  style={[
                    styles.explanationLabelText,
                    { color: isCorrect ? colors.success : colors.primary },
                  ]}>
                  Explanation
                </Text>
              </View>

              <ScrollView
                style={styles.explanationScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled>
                <Text
                  style={[
                    styles.explanationText,
                    {
                      color: isDark ? '#FAF5EE' : '#554E4F',
                      fontSize: scaleFont(11.5),
                      lineHeight: scaleFont(16.5),
                    },
                  ]}>
                  {question.explanation
                    ? question.explanation
                    : t('reels.noExplanation')}
                </Text>
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Card Footer: Navigation & Gesture Hint */}
        <View style={styles.footerRow}>
          <View style={styles.swipeHintGroup}>
            <Ionicons name="chevron-up" size={16} color={colors.textTertiary} />
            <Text style={[styles.swipeHintLabel, { color: colors.textTertiary }]}>
              {t('reels.swipeUpHint')}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
            onPress={onNextQuestion}>
            <Text style={[styles.nextBtnText, { color: colors.textInverse }]}>
              {t('reels.nextQuestion')}
            </Text>
            <Ionicons name="arrow-down" size={16} color={colors.textInverse} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  cardOuter: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  examYearText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionContainer: {
    maxHeight: 150,
    marginVertical: Spacing.xs,
  },
  questionScroll: {
    maxHeight: 140,
  },
  questionText: {
    ...Typography.bodyMedium,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  optionsList: {
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minHeight: 46,
  },
  optIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  optIndexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  optionText: {
    ...Typography.body,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    marginRight: Spacing.xs,
  },
  feedbackContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 6,
    maxHeight: 130,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  explanationCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 3,
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  explanationLabelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  explanationScroll: {
    maxHeight: 52,
  },
  explanationText: {
    ...Typography.caption,
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  swipeHintGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  swipeHintLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  nextBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
