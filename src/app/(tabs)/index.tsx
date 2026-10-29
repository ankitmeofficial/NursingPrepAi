import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { getAllPapers, getAvailableYears, getPapersByYear } from '@/data/papers';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { getAllQuestions } from '@/services/questionService';
import { QuestionPaper } from '@/types/paper';

interface QuickMockPreset {
  id: string;
  count: number;
  label: string;
  duration: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPopular?: boolean;
  isCustom?: boolean;
}

const MOCK_PRESETS: QuickMockPreset[] = [
  {
    id: '10q',
    count: 10,
    label: '10 Qs',
    duration: '10 Mins',
    icon: 'flash-outline',
  },
  {
    id: '20q',
    count: 20,
    label: '20 Qs',
    duration: '20 Mins',
    icon: 'flame-outline',
    isPopular: true,
  },
  {
    id: '50q',
    count: 50,
    label: '50 Qs',
    duration: '50 Mins',
    icon: 'trophy-outline',
  },
  {
    id: 'custom',
    count: 0,
    label: 'Custom',
    duration: 'Filter Topics',
    icon: 'options-outline',
    isCustom: true,
  },
];

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { t } = useLanguage();

  // Only years with authentic question papers available (removes empty years from sorting)
  const availableYears = useMemo(() => getAvailableYears(), []);
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostFilter, setSelectedPostFilter] = useState<'ALL' | 'NURSING' | 'PARAMEDICAL'>('ALL');
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
  const [sampleOptionAnswers, setSampleOptionAnswers] = useState<Record<string, number>>({});
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
  const [showExamInfoModal, setShowExamInfoModal] = useState(false);

  const SAVED_PAPERS_STORAGE_KEY = '@nursing_prep_favorite_papers_v1';

  // Load saved papers from persistent storage
  useEffect(() => {
    AsyncStorage.getItem(SAVED_PAPERS_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const ids: string[] = JSON.parse(raw);
          setSavedPaperIds(new Set(ids));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleFavoritePaper = (paperId: string) => {
    setSavedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      AsyncStorage.setItem(SAVED_PAPERS_STORAGE_KEY, JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  };

  const handleSelectSampleOption = (questionId: string, optionIndex: number) => {
    setSampleOptionAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const totalQuestionsCount = useMemo(() => {
    return getAllQuestions().length;
  }, []);

  const allOfficialPapers = useMemo(() => {
    return getAllPapers();
  }, []);

  const nursingCount = useMemo(() => {
    return allOfficialPapers.filter((p) => p.post.toLowerCase().includes('nurs')).length;
  }, [allOfficialPapers]);

  const paramedicalCount = useMemo(() => {
    return allOfficialPapers.filter((p) => !p.post.toLowerCase().includes('nurs')).length;
  }, [allOfficialPapers]);

  // Filter papers interactively by year, post category, and search query
  const displayedPapers = useMemo(() => {
    let list = selectedYear === 'ALL' ? allOfficialPapers : getPapersByYear(selectedYear);

    if (selectedPostFilter === 'NURSING') {
      list = list.filter((p) => p.post.toLowerCase().includes('nurs'));
    } else if (selectedPostFilter === 'PARAMEDICAL') {
      list = list.filter((p) => !p.post.toLowerCase().includes('nurs'));
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.examName.toLowerCase().includes(q) ||
        p.post.toLowerCase().includes(q) ||
        p.sessionLabel.toLowerCase().includes(q) ||
        p.examDate.toLowerCase().includes(q) ||
        String(p.year).includes(q) ||
        p.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedYear, selectedPostFilter, searchQuery, allOfficialPapers]);

  // Group displayed papers by year for prominent year sectioning and highlights
  const groupedPapers = useMemo(() => {
    const groups: { year: number; papers: QuestionPaper[] }[] = [];
    const map = new Map<number, QuestionPaper[]>();

    for (const paper of displayedPapers) {
      if (!map.has(paper.year)) {
        map.set(paper.year, []);
      }
      map.get(paper.year)!.push(paper);
    }

    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);
    for (const yr of sortedYears) {
      groups.push({
        year: yr,
        papers: map.get(yr)!,
      });
    }

    return groups;
  }, [displayedPapers]);

  const handleOpenPaper = (paper: QuestionPaper) => {
    router.push({
      pathname: '/paper/[id]',
      params: { id: paper.id },
    });
  };

  const handleStartPractice = (count: number) => {
    router.push({
      pathname: '/practice/session',
      params: { count: String(count) },
    });
  };

  return (
    <ScreenContainer useTopSafeArea scrollable>
      {/* 1. Sleek Top Navigation Bar (Branding + Fast Actions) */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="pulse" size={20} color={colors.textInverse} />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>NursingPrep</Text>
            <View style={styles.brandBadgePill}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.brandBadgeText, { color: colors.primary }]}>
                RRB NURSING 2026
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Icons: Saved Questions & Review Mistakes */}
        <View style={styles.topActionsRow}>
          <Pressable
            accessibilityLabel="Saved Questions"
            style={({ pressed }) => [
              styles.iconActionBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/bookmarks')}>
            <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
          </Pressable>

          <Pressable
            accessibilityLabel="Review Incorrect"
            style={({ pressed }) => [
              styles.iconActionBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/review')}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {/* 2. Inspiring Hero Welcome Card (Airy, Uncluttered, Student-Centric) */}
      <View
        style={[
          styles.heroBanner,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTextContainer}>
          <Text style={[styles.heroHeading, { color: colors.text }]}>
            Master RRB Nursing Exam
          </Text>
          <Text style={[styles.heroSubheading, { color: colors.textSecondary }]}>
            Practice official previous-year papers and daily timed mock questions.
          </Text>
        </View>

        {/* Unified 3-Stat Badge Strip (Interactive) */}
        <View
          style={[
            styles.statsStrip,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
          ]}>
          <Pressable
            style={({ pressed }) => [styles.statItem, pressed && styles.pressed]}
            onPress={() => setSelectedYear('ALL')}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {allOfficialPapers.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Official Papers
            </Text>
          </Pressable>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <Pressable
            style={({ pressed }) => [styles.statItem, pressed && styles.pressed]}
            onPress={() => router.push('/practice/setup')}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {totalQuestionsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Verified MCQs
            </Text>
          </Pressable>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <Pressable
            style={({ pressed }) => [styles.statItem, pressed && styles.pressed]}
            onPress={() => setShowExamInfoModal(true)}>
            <View style={styles.statCbtRow}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>90 Mins</Text>
              <Ionicons name="information-circle-outline" size={13} color={colors.primary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              CBT Pattern
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Primary Study Tracks (2 Prominent Cards: Question Reels & Official PYQ) */}
      <View style={styles.studyTracksRow}>
        {/* Track A: Question Reels */}
        <Pressable
          style={({ pressed }) => [
            styles.studyTrackCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/reels')}>
          <View
            style={[
              styles.trackIconWrap,
              { backgroundColor: colors.primaryLight },
            ]}>
            <Ionicons name="play-circle" size={24} color={colors.primary} />
          </View>
          <View style={styles.trackContent}>
            <View style={styles.trackHeaderRow}>
              <Text style={[styles.trackTitle, { color: colors.text }]}>
                MCQ Reels
              </Text>
              <View style={[styles.trackPillBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.trackPillBadgeText, { color: colors.primaryDark }]}>
                  INSTANT
                </Text>
              </View>
            </View>
            <Text style={[styles.trackDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              Swipe & practice high-yield MCQs with explanations
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      {/* 4. Quick Mock Tests Section (Clean 4 Presets) */}
      <View style={styles.sectionHeaderWrap}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('home.quickMockTitle')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('home.quickMockSubtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.presetGrid}>
        {MOCK_PRESETS.map((preset) => {
          const isHighlight = preset.isPopular;

          return (
            <Pressable
              key={preset.id}
              style={({ pressed }) => [
                styles.presetCard,
                {
                  backgroundColor: isHighlight ? colors.primaryLight : colors.card,
                  borderColor: isHighlight ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                if (preset.isCustom) {
                  router.push('/practice/setup');
                } else {
                  handleStartPractice(preset.count);
                }
              }}>
              <View style={styles.presetTopRow}>
                <View
                  style={[
                    styles.presetIconWrap,
                    {
                      backgroundColor: isHighlight
                        ? colors.primary
                        : colors.surfaceMuted,
                    },
                  ]}>
                  <Ionicons
                    name={preset.icon}
                    size={16}
                    color={isHighlight ? colors.textInverse : colors.primary}
                  />
                </View>

                {preset.isPopular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.popularBadgeText, { color: colors.textInverse }]}>
                      POPULAR
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.presetCountText, { color: colors.text }]}>
                {preset.label}
              </Text>
              <Text style={[styles.presetDurationText, { color: colors.textSecondary }]}>
                {preset.duration}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 5. Official Previous-Year Question Papers */}
      <View style={styles.sectionHeaderWrap}>
        <View style={styles.pyqHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.pyqTitle')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {selectedYear === 'ALL'
                ? `${availableYears.length} Exam Years Available (${availableYears[availableYears.length - 1]}–${availableYears[0]}) • Latest First`
                : `Year ${selectedYear} Question Papers`}
            </Text>
          </View>
          <View style={[styles.availableCountPill, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.availableCountText, { color: colors.success }]}>
              {displayedPapers.length} Available
            </Text>
          </View>
        </View>
      </View>

      {/* Clean Year Sorting Chips (Only Years with Available Question Papers) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearChipScroll}>
        {/* All Papers Chip */}
        <Pressable
          style={[
            styles.yearChip,
            selectedYear === 'ALL'
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => setSelectedYear('ALL')}>
          <Ionicons
            name="layers-outline"
            size={13}
            color={selectedYear === 'ALL' ? colors.textInverse : colors.primary}
          />
          <Text
            style={[
              styles.yearChipText,
              { color: selectedYear === 'ALL' ? colors.textInverse : colors.text },
            ]}>
            All
          </Text>
          <View
            style={[
              styles.yearChipCountPill,
              {
                backgroundColor:
                  selectedYear === 'ALL'
                    ? 'rgba(255, 255, 255, 0.25)'
                    : colors.surfaceMuted,
              },
            ]}>
            <Text
              style={[
                styles.yearChipCountText,
                { color: selectedYear === 'ALL' ? colors.textInverse : colors.textSecondary },
              ]}>
              {allOfficialPapers.length}
            </Text>
          </View>
        </Pressable>

        {/* Available Years (e.g. 2026, 2025, 2019, 2018, 2015) - Empty years removed */}
        {availableYears.map((year) => {
          const isSelected = selectedYear === year;
          const count = getPapersByYear(year).length;

          return (
            <Pressable
              key={year}
              style={[
                styles.yearChip,
                isSelected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setSelectedYear(year)}>
              <Ionicons
                name="calendar"
                size={12}
                color={isSelected ? colors.textInverse : colors.primary}
              />
              <Text
                style={[
                  styles.yearChipText,
                  { color: isSelected ? colors.textInverse : colors.text },
                ]}>
                {year}
              </Text>
              <View
                style={[
                  styles.yearChipCountPill,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.25)'
                      : colors.surfaceMuted,
                  },
                ]}>
                <Text
                  style={[
                    styles.yearChipCountText,
                    { color: isSelected ? colors.textInverse : colors.textSecondary },
                  ]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Interactive Search & Post Category Filters */}
      <View style={styles.searchAndFilterWrap}>
        <View
          style={[
            styles.searchBarBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search papers (e.g. 2026, Nursing, ECG, Shift 2)..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.trim().length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.searchClearBtn}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Post category filter pills */}
        <View style={styles.postFilterChipsRow}>
          <Pressable
            style={[
              styles.postFilterChip,
              selectedPostFilter === 'ALL'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedPostFilter('ALL')}>
            <Text
              style={[
                styles.postFilterChipText,
                { color: selectedPostFilter === 'ALL' ? colors.textInverse : colors.textSecondary },
              ]}>
              All ({allOfficialPapers.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.postFilterChip,
              selectedPostFilter === 'NURSING'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedPostFilter('NURSING')}>
            <Ionicons
              name="medkit"
              size={12}
              color={selectedPostFilter === 'NURSING' ? colors.textInverse : colors.primary}
            />
            <Text
              style={[
                styles.postFilterChipText,
                { color: selectedPostFilter === 'NURSING' ? colors.textInverse : colors.textSecondary },
              ]}>
              Nursing ({nursingCount})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.postFilterChip,
              selectedPostFilter === 'PARAMEDICAL'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedPostFilter('PARAMEDICAL')}>
            <Ionicons
              name="pulse"
              size={12}
              color={selectedPostFilter === 'PARAMEDICAL' ? colors.textInverse : colors.accent}
            />
            <Text
              style={[
                styles.postFilterChipText,
                { color: selectedPostFilter === 'PARAMEDICAL' ? colors.textInverse : colors.textSecondary },
              ]}>
              Paramedical ({paramedicalCount})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Papers List or Empty State */}
      {displayedPapers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            iconName="document-text-outline"
            title={
              searchQuery.trim().length > 0
                ? 'No matching papers found'
                : t('home.emptyYearTitle', {
                    year: selectedYear === 'ALL' ? 'Selected Range' : selectedYear,
                  })
            }
            description={
              searchQuery.trim().length > 0
                ? `No question papers matched "${searchQuery}". Try clearing filters.`
                : t('home.emptyYearDesc', {
                    year: selectedYear === 'ALL' ? 'Selected Range' : selectedYear,
                  })
            }
            badgeLabel={
              searchQuery.trim().length > 0 ? 'Search filter active' : `Year ${selectedYear} • 0 Available`
            }
            badgeVariant="neutral"
          />
          <Pressable
            style={({ pressed }) => [
              styles.backTo2026Btn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
            onPress={() => {
              setSelectedYear('ALL');
              setSelectedPostFilter('ALL');
              setSearchQuery('');
            }}>
            <Ionicons name="refresh-outline" size={16} color={colors.textInverse} />
            <Text style={[styles.backTo2026BtnText, { color: colors.textInverse }]}>
              {`Reset Filters (${allOfficialPapers.length} Papers)`}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.papersContainer}>
          {groupedPapers.map((group) => {
            return (
              <View key={group.year} style={styles.yearGroupSection}>
                {/* Prominently Highlighted Year Header Anchor */}
                <View
                  style={[
                    styles.yearGroupHeader,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}>
                  <View style={[styles.yearGroupBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="calendar" size={13} color={colors.textInverse} />
                    <Text style={[styles.yearGroupBadgeText, { color: colors.textInverse }]}>
                      {group.year}
                    </Text>
                  </View>
                  <Text style={[styles.yearGroupTitleText, { color: colors.text }]} numberOfLines={1}>
                    {group.year === 2026
                      ? 'Official Latest Exam Papers'
                      : group.year === 2025
                      ? 'Nursing Superintendent Shift Papers'
                      : 'RRB Staff Nurse Official Papers'}
                  </Text>
                  <View style={[styles.yearGroupCountPill, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.yearGroupCountText, { color: colors.primaryDark }]}>
                      {group.papers.length} {group.papers.length === 1 ? 'Paper' : 'Papers'}
                    </Text>
                  </View>
                </View>

                {/* Cards for this Year */}
                <View style={styles.yearGroupCardsCol}>
                  {group.papers.map((paper) => {
                    const isNursing = paper.post.toLowerCase().includes('nurs');
                    const postLabel = paper.post;
                    const isExpanded = expandedPaperId === paper.id;
                    const isFavorite = savedPaperIds.has(paper.id);

                    return (
                      <View
                        key={paper.id}
                        style={[
                          styles.paperCard,
                          {
                            backgroundColor: colors.card,
                            borderColor: isExpanded ? colors.primary : colors.border,
                          },
                        ]}>
                        {/* Left Visual Accent Bar */}
                        <View
                          style={[
                            styles.paperAccentBar,
                            { backgroundColor: isNursing ? colors.primary : colors.accent },
                          ]}
                        />

                        <View style={styles.paperContentWrap}>
                          {/* Top Line: Post Badge + Highlighted Year & Shift */}
                          <View style={styles.paperHeaderRow}>
                            <View style={styles.paperPostBadgeRow}>
                              <View
                                style={[
                                  styles.postTypeBadge,
                                  {
                                    backgroundColor: isNursing
                                      ? colors.primaryLight
                                      : colors.surfaceMuted,
                                  },
                                ]}>
                                <Ionicons
                                  name={isNursing ? 'medkit' : 'pulse'}
                                  size={12}
                                  color={isNursing ? colors.primaryDark : colors.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.postTypeBadgeText,
                                    {
                                      color: isNursing
                                        ? colors.primaryDark
                                        : colors.textSecondary,
                                    },
                                  ]}>
                                  {postLabel}
                                </Text>
                              </View>

                              {/* Prominently Highlighted Year Badge */}
                              <View
                                style={[
                                  styles.yearTagPill,
                                  {
                                    backgroundColor: colors.primaryLight,
                                    borderColor: colors.primary,
                                  },
                                ]}>
                                <Ionicons name="calendar" size={11} color={colors.primaryDark} />
                                <Text style={[styles.yearTagText, { color: colors.primaryDark }]}>
                                  {paper.year}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.paperRightHeaderActions}>
                              <Text style={[styles.questionsBadgeText, { color: colors.textSecondary }]}>
                                {paper.totalQuestions} MCQs
                              </Text>
                              <Pressable
                                accessibilityLabel={isFavorite ? 'Remove bookmark' : 'Bookmark paper'}
                                hitSlop={8}
                                onPress={() => handleToggleFavoritePaper(paper.id)}
                                style={styles.bookmarkPaperBtn}>
                                <Ionicons
                                  name={isFavorite ? 'bookmark' : 'bookmark-outline'}
                                  size={17}
                                  color={isFavorite ? colors.primary : colors.textTertiary}
                                />
                              </Pressable>
                            </View>
                          </View>

                          {/* Exam Name & Shift Timing */}
                          <Pressable onPress={() => handleOpenPaper(paper)}>
                            <Text style={[styles.paperTitleText, { color: colors.text }]}>
                              {paper.examName}
                            </Text>
                            <Text style={[styles.paperSubtitleText, { color: colors.textSecondary }]}>
                              {paper.sessionLabel} • {paper.examDate}
                            </Text>
                          </Pressable>

                          {/* Section Breakdown Strip */}
                          <View
                            style={[
                              styles.breakdownStrip,
                              { backgroundColor: colors.surfaceMuted },
                            ]}>
                            <View style={styles.breakdownItem}>
                              <Ionicons name="pie-chart-outline" size={13} color={colors.primary} />
                              <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
                                {paper.generalAbilityCount} General Ability
                              </Text>
                            </View>
                            <Text style={[styles.breakdownBullet, { color: colors.textTertiary }]}>•</Text>
                            <View style={styles.breakdownItem}>
                              <Ionicons name="book-outline" size={13} color={colors.accent} />
                              <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
                                {paper.professionalAbilityCount} Professional Ability
                              </Text>
                            </View>
                          </View>

                          {/* Action Bar: Quick Peek + Solve Paper */}
                          <View style={styles.paperCardFooter}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.quickPeekBtn,
                                {
                                  borderColor: isExpanded ? colors.primary : colors.border,
                                  backgroundColor: isExpanded ? colors.primaryLight : colors.surfaceMuted,
                                },
                                pressed && styles.pressed,
                              ]}
                              onPress={() => setExpandedPaperId(isExpanded ? null : paper.id)}>
                              <Ionicons
                                name={isExpanded ? 'chevron-up-circle' : 'eye-outline'}
                                size={14}
                                color={isExpanded ? colors.primaryDark : colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.quickPeekBtnText,
                                  { color: isExpanded ? colors.primaryDark : colors.textSecondary },
                                ]}>
                                {isExpanded ? 'Hide Sample' : 'Quick Peek (2 Qs)'}
                              </Text>
                            </Pressable>

                            <Pressable
                              style={({ pressed }) => [
                                styles.solvePaperBtn,
                                { backgroundColor: colors.primary },
                                pressed && styles.pressed,
                              ]}
                              onPress={() => handleOpenPaper(paper)}>
                              <Text style={[styles.solvePaperBtnText, { color: colors.textInverse }]}>
                                {t('home.solvePaper')}
                              </Text>
                              <Ionicons name="arrow-forward" size={12} color={colors.textInverse} />
                            </Pressable>
                          </View>

                          {/* Expandable Quick Peek Sample Questions Drawer */}
                          {isExpanded && (
                            <View
                              style={[
                                styles.samplePreviewContainer,
                                {
                                  backgroundColor: colors.surfaceMuted,
                                  borderColor: colors.borderLight,
                                },
                              ]}>
                              <View style={styles.samplePreviewHeader}>
                                <Text style={[styles.samplePreviewTitle, { color: colors.text }]}>
                                  Sample Questions Preview
                                </Text>
                                <Text style={[styles.samplePreviewHint, { color: colors.textTertiary }]}>
                                  Tap an option to test yourself
                                </Text>
                              </View>

                              {paper.questions.slice(0, 2).map((q, qIndex) => {
                                const selectedOpt = sampleOptionAnswers[q.id];
                                const hasAnswered = selectedOpt !== undefined;

                                return (
                                  <View
                                    key={q.id}
                                    style={[
                                      styles.sampleQuestionCard,
                                      { backgroundColor: colors.card, borderColor: colors.border },
                                    ]}>
                                    <Text style={[styles.sampleQuestionNumText, { color: colors.primary }]}>
                                      Q{qIndex + 1}. {q.topic || q.section}
                                    </Text>
                                    <Text style={[styles.sampleQuestionText, { color: colors.text }]}>
                                      {q.text}
                                    </Text>

                                    {/* Interactive Options */}
                                    <View style={styles.sampleOptionsCol}>
                                      {q.options.map((opt, optIndex) => {
                                        const isSelected = selectedOpt === optIndex;
                                        const isCorrect = optIndex === q.correctOptionIndex;

                                        let optBg = colors.surfaceMuted;
                                        let optBorder = colors.border;
                                        let optTextColor = colors.text;

                                        if (hasAnswered) {
                                          if (isCorrect) {
                                            optBg = colors.successLight;
                                            optBorder = colors.success;
                                            optTextColor = colors.success;
                                          } else if (isSelected) {
                                            optBg = colors.errorLight;
                                            optBorder = colors.error;
                                            optTextColor = colors.error;
                                          }
                                        }

                                        return (
                                          <Pressable
                                            key={optIndex}
                                            style={({ pressed }) => [
                                              styles.sampleOptionBtn,
                                              { backgroundColor: optBg, borderColor: optBorder },
                                              pressed && styles.pressed,
                                            ]}
                                            onPress={() => handleSelectSampleOption(q.id, optIndex)}>
                                            <View
                                              style={[
                                                styles.sampleOptionIndex,
                                                {
                                                  backgroundColor:
                                                    hasAnswered && isCorrect
                                                      ? colors.success
                                                      : hasAnswered && isSelected
                                                      ? colors.error
                                                      : colors.border,
                                                },
                                              ]}>
                                              <Text
                                                style={[
                                                  styles.sampleOptionIndexText,
                                                  {
                                                    color:
                                                      hasAnswered && (isCorrect || isSelected)
                                                        ? colors.textInverse
                                                        : colors.textSecondary,
                                                  },
                                                ]}>
                                                {String.fromCharCode(65 + optIndex)}
                                              </Text>
                                            </View>
                                            <Text
                                              style={[styles.sampleOptionText, { color: optTextColor }]}
                                              numberOfLines={2}>
                                              {opt}
                                            </Text>
                                          </Pressable>
                                        );
                                      })}
                                    </View>

                                    {hasAnswered && (
                                      <View
                                        style={[
                                          styles.sampleResultBanner,
                                          {
                                            backgroundColor:
                                              selectedOpt === q.correctOptionIndex
                                                ? colors.successLight
                                                : colors.errorLight,
                                            borderColor:
                                              selectedOpt === q.correctOptionIndex
                                                ? colors.success
                                                : colors.error,
                                          },
                                        ]}>
                                        {selectedOpt === q.correctOptionIndex ? (
                                          <View style={styles.sampleStatusRow}>
                                            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                                            <Text style={[styles.samplePillText, { color: colors.success }]}>
                                              Correct! (+1 Mark)
                                            </Text>
                                          </View>
                                        ) : (
                                          <View style={styles.sampleStatusRow}>
                                            <View
                                              style={[
                                                styles.samplePill,
                                                { backgroundColor: colors.card, borderColor: colors.error },
                                              ]}>
                                              <Ionicons name="close-circle" size={12} color={colors.error} />
                                              <Text style={[styles.samplePillText, { color: colors.error }]}>
                                                Incorrect (-0.33)
                                              </Text>
                                            </View>

                                            <View
                                              style={[
                                                styles.samplePill,
                                                { backgroundColor: colors.card, borderColor: colors.success },
                                              ]}>
                                              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                              <Text style={[styles.samplePillText, { color: colors.success }]}>
                                                Correct: Option ({String.fromCharCode(65 + q.correctOptionIndex)})
                                              </Text>
                                            </View>
                                          </View>
                                        )}

                                        {q.explanation && (
                                          <View
                                            style={[
                                              styles.sampleExplanationBox,
                                              {
                                                backgroundColor: colors.card,
                                                borderColor: colors.borderLight,
                                              },
                                            ]}>
                                            <Text
                                              style={[
                                                styles.sampleExplanationText,
                                                { color: colors.textSecondary },
                                              ]}
                                              numberOfLines={2}>
                                              {q.explanation}
                                            </Text>
                                          </View>
                                        )}
                                      </View>
                                    )}
                                  </View>
                                );
                              })}

                              {/* Call to Action to solve all */}
                              <Pressable
                                style={({ pressed }) => [
                                  styles.viewFullPaperCta,
                                  { backgroundColor: colors.primary },
                                  pressed && styles.pressed,
                                ]}
                                onPress={() => handleOpenPaper(paper)}>
                                <Text style={[styles.viewFullPaperCtaText, { color: colors.textInverse }]}>
                                  Solve Full Paper ({paper.totalQuestions} Questions)
                                </Text>
                                <Ionicons name="arrow-forward" size={14} color={colors.textInverse} />
                              </Pressable>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 6. Interactive CBT Exam Specifications Modal */}
      <Modal
        visible={showExamInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExamInfoModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowExamInfoModal(false)}
          />
          <View
            style={[
              styles.modalContentCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  RRB Nursing CBT Exam Pattern
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Official Railway Recruitment Board Scheme
                </Text>
              </View>
              <Pressable
                onPress={() => setShowExamInfoModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.patternSpecsGrid}>
              <View
                style={[
                  styles.patternSpecBox,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
                ]}>
                <Text style={[styles.patternSpecVal, { color: colors.primary }]}>100</Text>
                <Text style={[styles.patternSpecLbl, { color: colors.textSecondary }]}>Total MCQs</Text>
              </View>
              <View
                style={[
                  styles.patternSpecBox,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
                ]}>
                <Text style={[styles.patternSpecVal, { color: colors.primary }]}>90 Mins</Text>
                <Text style={[styles.patternSpecLbl, { color: colors.textSecondary }]}>Time Duration</Text>
              </View>
              <View
                style={[
                  styles.patternSpecBox,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
                ]}>
                <Text style={[styles.patternSpecVal, { color: colors.accent }]}>70 MCQs</Text>
                <Text style={[styles.patternSpecLbl, { color: colors.textSecondary }]}>Professional Domain</Text>
              </View>
              <View
                style={[
                  styles.patternSpecBox,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.borderLight },
                ]}>
                <Text style={[styles.patternSpecVal, { color: colors.warning }]}>-1/3 Mark</Text>
                <Text style={[styles.patternSpecLbl, { color: colors.textSecondary }]}>Negative Marking</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalActionBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setShowExamInfoModal(false);
                router.push('/practice/setup');
              }}>
              <Text style={[styles.modalActionBtnText, { color: colors.textInverse }]}>
                Start Full CBT Mock Test
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Top App Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Banner
  heroBanner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...(Platform.OS === 'web' ? Shadows.sm : {}),
  },
  heroTextContainer: {
    gap: 4,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  heroSubheading: {
    fontSize: 13,
    lineHeight: 19,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
  },

  // Study Tracks
  studyTracksRow: {
    marginBottom: Spacing.md,
  },
  studyTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    ...(Platform.OS === 'web' ? Shadows.sm : {}),
  },
  trackIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackContent: {
    flex: 1,
    gap: 2,
  },
  trackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  trackPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  trackPillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trackDesc: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Section Headers
  sectionHeaderWrap: {
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },

  // Quick Mock Presets Grid (2x2)
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  presetCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 4,
    ...(Platform.OS === 'web' ? Shadows.sm : {}),
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  presetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  presetCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetDurationText: {
    fontSize: 11,
  },

  // PYQ Header
  pyqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableCountPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  availableCountText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Year Filter / Sorting
  yearChipScroll: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  yearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    gap: 6,
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  yearChipCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  yearChipCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  yearActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Papers List
  papersContainer: {
    gap: Spacing.lg,
  },
  yearGroupSection: {
    gap: Spacing.sm,
  },
  yearGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginBottom: 2,
    ...(Platform.OS === 'web' ? Shadows.sm : {}),
  },
  yearGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  yearGroupBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  yearGroupTitleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  yearGroupCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  yearGroupCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  yearGroupCardsCol: {
    gap: Spacing.sm,
  },
  paperCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? Shadows.sm : {}),
  },
  paperAccentBar: {
    width: 5,
  },
  paperContentWrap: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  paperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperPostBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  postTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  yearTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  yearTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  questionsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paperTitleText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  paperSubtitleText: {
    fontSize: 12,
  },
  breakdownStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: 2,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownText: {
    fontSize: 10,
    fontWeight: '600',
  },
  breakdownBullet: {
    fontSize: 10,
  },
  paperCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  officialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  officialTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  solvePaperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  solvePaperBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statCbtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  // Search & Filters
  searchAndFilterWrap: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  postFilterChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  postFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  postFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Paper Card Header Actions
  paperRightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bookmarkPaperBtn: {
    padding: 3,
  },
  quickPeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  quickPeekBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Quick Peek Sample Questions
  samplePreviewContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  samplePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  samplePreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  samplePreviewHint: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  sampleQuestionCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sampleQuestionNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sampleQuestionText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  sampleOptionsCol: {
    gap: 5,
    marginTop: 2,
  },
  sampleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  sampleOptionIndex: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleOptionIndexText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sampleOptionText: {
    fontSize: 11,
    flex: 1,
  },
  sampleResultBanner: {
    padding: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: 4,
    gap: 5,
  },
  sampleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  samplePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  samplePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sampleResultText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sampleExplanationBox: {
    padding: 5,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  sampleExplanationText: {
    fontSize: 10,
    lineHeight: 14,
  },
  viewFullPaperCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewFullPaperCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Exam Info Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...(Platform.OS === 'web' ? Shadows.md : {}),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  patternSpecsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  patternSpecBox: {
    width: '48%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  patternSpecVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  patternSpecLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    gap: Spacing.sm,
  },
  backTo2026Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backTo2026BtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
});
