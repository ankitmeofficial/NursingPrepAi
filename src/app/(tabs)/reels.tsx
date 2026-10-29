import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { InteractiveReelBackground } from '@/components/reels/InteractiveReelBackground';
import { ReelCard } from '@/components/reels/ReelCard';
import { ReelInstructionsModal } from '@/components/reels/ReelInstructionsModal';
import { BorderRadius, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import {
  getAllBookmarks,
  recordAttempt,
  toggleBookmark,
} from '@/database/repository';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { getRandomQuestions } from '@/services/questionService';
import { Question } from '@/types/paper';

const BATCH_SIZE = 15;
const RECENT_QUEUE_MAX = 40;
const REELS_TUTORIAL_KEY = '@nursing_prep_reel_tutorial_seen';

export default function ReelsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeThemeName, setActiveThemeName] = useState<string | null>(null);

  // Rolling queue of recently displayed IDs to prevent repetition
  const recentIdsRef = useRef<string[]>([]);
  const scrollViewRef = useRef<any>(null);

  const { height: windowHeight } = Dimensions.get('window');

  // Compute exact height for each full-screen question reel
  const bottomBarHeight = Platform.OS === 'web' ? 62 : 60 + Math.max(insets.bottom, 8);
  const headerHeight = 52 + insets.top;
  const cardHeight = Math.max(480, windowHeight - headerHeight - bottomBarHeight);

  // Load batch of randomized non-repeating questions
  const loadMoreQuestions = useCallback((count = BATCH_SIZE) => {
    const { questions: newBatch } = getRandomQuestions(count, {
      excludeIds: recentIdsRef.current,
    });

    if (newBatch.length > 0) {
      newBatch.forEach((q) => {
        recentIdsRef.current.push(q.id);
        if (recentIdsRef.current.length > RECENT_QUEUE_MAX) {
          recentIdsRef.current.shift();
        }
      });
      setQuestions((prev) => [...prev, ...newBatch]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMoreQuestions(BATCH_SIZE);
  }, [loadMoreQuestions]);

  // First-time instruction check
  useEffect(() => {
    AsyncStorage.getItem(REELS_TUTORIAL_KEY)
      .then((seen) => {
        if (!seen) {
          setShowTutorial(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismissTutorial = async () => {
    setShowTutorial(false);
    try {
      await AsyncStorage.setItem(REELS_TUTORIAL_KEY, 'true');
    } catch {}
  };

  // Sync bookmarks from repository
  useEffect(() => {
    getAllBookmarks().then((bookmarks) => {
      setBookmarkedSet(new Set(bookmarks.map((b) => b.questionId)));
    });
  }, []);

  const handleSelectOption = useCallback(
    async (question: Question, optionIndex: number) => {
      if (selectedAnswers[question.id] !== undefined) return;

      const isCorrect = optionIndex === question.correctOptionIndex;

      setSelectedAnswers((prev) => ({
        ...prev,
        [question.id]: optionIndex,
      }));

      // Persist attempt to SQLite / AsyncStorage
      await recordAttempt({
        questionId: question.id,
        paperId: question.paperId || 'reels_pool',
        section: question.section,
        selectedOptionIndex: optionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        timestamp: Date.now(),
        mode: 'reels',
      });
    },
    [selectedAnswers]
  );

  const handleToggleBookmark = useCallback(async (questionId: string) => {
    const isSaved = await toggleBookmark(questionId);
    setBookmarkedSet((prev) => {
      const next = new Set(prev);
      if (isSaved) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      scrollViewRef.current?.scrollTo({
        y: nextIdx * cardHeight,
        animated: true,
      });
    }
  }, [currentIndex, questions.length, cardHeight]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / cardHeight);
    if (index !== currentIndex && index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      // Fetch next batch when within 3 questions of end
      if (index >= questions.length - 3) {
        loadMoreQuestions(10);
      }
    }
  };

  const handleRestartFeed = () => {
    recentIdsRef.current = [];
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    loadMoreQuestions(BATCH_SIZE);
  };

  const currentQuestion = questions[currentIndex];
  const isCurrentAnswered = currentQuestion
    ? selectedAnswers[currentQuestion.id] !== undefined
    : false;
  const isCurrentCorrect =
    isCurrentAnswered && currentQuestion
      ? selectedAnswers[currentQuestion.id] === currentQuestion.correctOptionIndex
      : false;

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.xl }]}>
        <EmptyState
          iconName="play-circle-outline"
          title={t('reels.endOfFeedTitle')}
          description={t('reels.endOfFeedDesc')}
          badgeLabel="Question Bank"
          badgeVariant="primary"
        />
        <Pressable
          style={[styles.restartButton, { backgroundColor: colors.primary }]}
          onPress={handleRestartFeed}>
          <Text style={[styles.restartButtonText, { color: colors.textInverse }]}>
            {t('reels.restartFeed')}
          </Text>
        </Pressable>
        <ReelInstructionsModal
          visible={showTutorial}
          onDismiss={handleDismissTutorial}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Interactive dynamic changing background */}
      <InteractiveReelBackground
        currentIndex={currentIndex}
        isAnswered={isCurrentAnswered}
        isCorrect={isCurrentCorrect}
        onThemeCycle={setActiveThemeName}
      />

      {/* Top Floating App Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : 8),
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('reels.title')}
          </Text>
          <View style={[styles.counterPill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.counterText, { color: colors.primaryDark }]}>
              {currentIndex + 1} / {questions.length}
            </Text>
          </View>
          {activeThemeName && (
            <View
              style={[
                styles.themePill,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}>
              <Ionicons name="color-palette-outline" size={11} color={colors.primary} />
              <Text style={[styles.themePillText, { color: colors.textSecondary }]}>
                {activeThemeName}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={({ pressed }) => [
              styles.headerActionBtn,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={() => setShowTutorial(true)}
            accessibilityLabel={t('reels.tutorialHelpTooltip')}>
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.headerActionBtn,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/bookmarks')}
            accessibilityLabel="View saved bookmarks">
            <Ionicons name="bookmark-outline" size={18} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.headerActionBtn,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}
            onPress={handleRestartFeed}
            accessibilityLabel="Shuffle questions">
            <Ionicons name="shuffle-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Paged Vertical Reel Feed */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.feedScroll}
        pagingEnabled={Platform.OS !== 'web'}
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {questions.map((q) => (
          <ReelCard
            key={q.id}
            question={q}
            cardHeight={cardHeight}
            isBookmarked={bookmarkedSet.has(q.id)}
            onToggleBookmark={handleToggleBookmark}
            onAnswerSelected={handleSelectOption}
            onNextQuestion={handleNext}
            initialSelectedOption={selectedAnswers[q.id]}
          />
        ))}
      </ScrollView>

      {/* First-time User Instructions Modal */}
      <ReelInstructionsModal
        visible={showTutorial}
        onDismiss={handleDismissTutorial}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.subtitle,
    fontSize: 16,
  },
  counterPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginLeft: Spacing.xs,
  },
  themePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedScroll: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  restartButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
