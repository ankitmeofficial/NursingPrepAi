import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { getAllBookmarks, toggleBookmark } from '@/database/repository';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { getQuestionsByIds } from '@/services/questionService';
import { Question } from '@/types/paper';

export default function BookmarksScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [revealedSet, setRevealedSet] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    try {
      const bookmarks = await getAllBookmarks();
      const ids = bookmarks.map((b) => b.questionId);
      const loaded = getQuestionsByIds(ids);
      setQuestions(loaded);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleRemoveBookmark = async (questionId: string) => {
    await toggleBookmark(questionId);
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleToggleReveal = (questionId: string) => {
    setRevealedSet((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
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
            {t('home.bookmarks')} ({questions.length})
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
        {questions.length === 0 ? (
          <EmptyState
            iconName="bookmark-outline"
            title="No Bookmarked Questions"
            description="Tap the bookmark icon on any question card in papers, practice sets, or Reels to save questions here for quick revision."
            badgeLabel="0 Saved"
            badgeVariant="neutral"
          />
        ) : (
          <View style={styles.questionsList}>
            {questions.map((q, idx) => {
              const selectedOption = selectedAnswers[q.id];
              const isAnswered = selectedOption !== undefined;
              const isRevealed = revealedSet.has(q.id) || isAnswered;

              return (
                <Card key={q.id} style={styles.questionCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.badgesGroup}>
                      <Text style={[styles.qNum, { color: colors.primary }]}>
                        #{idx + 1}
                      </Text>
                      <Badge
                        label={q.section === 'General Ability' ? 'GA' : 'NURSING'}
                        variant={q.section === 'General Ability' ? 'neutral' : 'primary'}
                      />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {q.examName ? `${q.examName}${q.year ? ` (${q.year})` : ''}` : 'RRB Question'}
                      </Text>
                    </View>

                    <Pressable
                      style={[styles.removeBtn, { backgroundColor: colors.primaryLight }]}
                      onPress={() => handleRemoveBookmark(q.id)}>
                      <Ionicons name="bookmark" size={16} color={colors.primary} />
                    </Pressable>
                  </View>

                  {/* Question Text */}
                  <Text style={[styles.questionText, { color: colors.text }]}>
                    {q.text}
                  </Text>

                  {/* Options */}
                  <View style={styles.optionsList}>
                    {q.options.map((optText, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrect = optIdx === q.correctOptionIndex;

                      let optBg = colors.surfaceMuted;
                      let optBorder = colors.border;
                      let icon = null;

                      if (isAnswered) {
                        if (isCorrect) {
                          optBg = colors.successLight;
                          optBorder = colors.success;
                          icon = <Ionicons name="checkmark-circle" size={18} color={colors.success} />;
                        } else if (isSelected) {
                          optBg = colors.errorLight;
                          optBorder = colors.error;
                          icon = <Ionicons name="close-circle" size={18} color={colors.error} />;
                        }
                      } else if (isRevealed && isCorrect) {
                        optBg = colors.successLight;
                        optBorder = colors.success;
                      }

                      return (
                        <Pressable
                          key={optIdx}
                          style={[
                            styles.optionRow,
                            { backgroundColor: optBg, borderColor: optBorder },
                          ]}
                          onPress={() => handleSelectOption(q.id, optIdx)}>
                          <Text style={[styles.optionLabel, { color: colors.primary }]}>
                            ({optIdx + 1})
                          </Text>
                          <Text style={[styles.optionText, { color: colors.text }]}>
                            {optText}
                          </Text>
                          {icon}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Footer Action */}
                  <View style={styles.footerRow}>
                    <Pressable
                      style={styles.revealBtn}
                      onPress={() => handleToggleReveal(q.id)}>
                      <Ionicons
                        name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={[styles.revealBtnText, { color: colors.primary }]}>
                        {isRevealed ? 'Hide Answer Key' : 'Reveal Answer Key'}
                      </Text>
                    </Pressable>

                    {isRevealed && (
                      <View style={[styles.answerBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                        <Text style={[styles.answerText, { color: colors.success }]}>
                          Correct Answer: Option ({q.correctOptionIndex + 1})
                        </Text>
                        <Text style={[styles.explanationText, { color: colors.text }]}>
                          {q.options[q.correctOptionIndex]}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
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
  },
  questionsList: {
    gap: Spacing.md,
  },
  questionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  qNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    ...Typography.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
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
    fontSize: 13,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  optionText: {
    ...Typography.body,
    fontSize: 13,
    flex: 1,
  },
  footerRow: {
    marginTop: Spacing.sm,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  revealBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  answerBox: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  answerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  explanationText: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
