import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  PerformanceStats,
  StoredAttempt,
  StoredBookmark,
  StoredPracticeSession,
} from './types';

import { getNativeSQLiteDatabase } from './sqlite';

const STORAGE_KEYS = {
  ATTEMPTS: '@nursing_prep_attempts_v1',
  BOOKMARKS: '@nursing_prep_bookmarks_v1',
  SESSIONS: '@nursing_prep_sessions_v1',
};

async function initSQLite() {
  return await getNativeSQLiteDatabase();
}

// ---------------- ATTEMPTS REPOSITORY ----------------

export async function recordAttempt(attempt: Omit<StoredAttempt, 'id'>): Promise<StoredAttempt> {
  const newAttempt: StoredAttempt = {
    ...attempt,
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };

  const db = await initSQLite();
  if (db) {
    try {
      db.runSync(
        `INSERT INTO attempts (id, questionId, paperId, section, selectedOptionIndex, correctOptionIndex, isCorrect, timestamp, sessionId, mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newAttempt.id,
          newAttempt.questionId,
          newAttempt.paperId,
          newAttempt.section,
          newAttempt.selectedOptionIndex,
          newAttempt.correctOptionIndex,
          newAttempt.isCorrect ? 1 : 0,
          newAttempt.timestamp,
          newAttempt.sessionId || null,
          newAttempt.mode,
        ]
      );
      return newAttempt;
    } catch (e) {
      console.warn('SQLite insert error:', e);
    }
  }

  // AsyncStorage fallback
  try {
    const existingRaw = await AsyncStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    const list: StoredAttempt[] = existingRaw ? JSON.parse(existingRaw) : [];
    list.unshift(newAttempt);
    // Keep max 2000 attempts in web local storage
    await AsyncStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(list.slice(0, 2000)));
  } catch {}

  return newAttempt;
}

export async function getAllAttempts(): Promise<StoredAttempt[]> {
  const db = await initSQLite();
  if (db) {
    try {
      const rows = db.getAllSync(
        `SELECT id, questionId, paperId, section, selectedOptionIndex, correctOptionIndex, isCorrect, timestamp, sessionId, mode
         FROM attempts ORDER BY timestamp DESC`
      );
      return rows.map((r: any) => ({
        ...r,
        isCorrect: Boolean(r.isCorrect),
      }));
    } catch (e) {
      console.warn('SQLite read error:', e);
    }
  }

  try {
    const existingRaw = await AsyncStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch {
    return [];
  }
}

// ---------------- BOOKMARKS REPOSITORY ----------------

export async function toggleBookmark(questionId: string): Promise<boolean> {
  const db = await initSQLite();
  if (db) {
    try {
      const existing = db.getFirstSync(
        `SELECT questionId FROM bookmarks WHERE questionId = ?`,
        [questionId]
      );
      if (existing) {
        db.runSync(`DELETE FROM bookmarks WHERE questionId = ?`, [questionId]);
        return false;
      } else {
        db.runSync(
          `INSERT INTO bookmarks (questionId, timestamp) VALUES (?, ?)`,
          [questionId, Date.now()]
        );
        return true;
      }
    } catch (e) {
      console.warn('SQLite bookmark error:', e);
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    let list: StoredBookmark[] = raw ? JSON.parse(raw) : [];
    const exists = list.some((b) => b.questionId === questionId);
    if (exists) {
      list = list.filter((b) => b.questionId !== questionId);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
      return false;
    } else {
      list.unshift({ questionId, timestamp: Date.now() });
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
      return true;
    }
  } catch {
    return false;
  }
}

export async function isQuestionBookmarked(questionId: string): Promise<boolean> {
  const db = await initSQLite();
  if (db) {
    try {
      const row = db.getFirstSync(
        `SELECT questionId FROM bookmarks WHERE questionId = ?`,
        [questionId]
      );
      return Boolean(row);
    } catch {}
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    const list: StoredBookmark[] = raw ? JSON.parse(raw) : [];
    return list.some((b) => b.questionId === questionId);
  } catch {
    return false;
  }
}

export async function getAllBookmarks(): Promise<StoredBookmark[]> {
  const db = await initSQLite();
  if (db) {
    try {
      const rows = db.getAllSync(
        `SELECT questionId, timestamp FROM bookmarks ORDER BY timestamp DESC`
      );
      return rows;
    } catch {}
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------- PRACTICE SESSIONS REPOSITORY ----------------

export async function savePracticeSession(
  session: StoredPracticeSession
): Promise<void> {
  const db = await initSQLite();
  if (db) {
    try {
      db.runSync(
        `INSERT INTO practice_sessions (id, startTime, endTime, totalQuestions, attemptedCount, correctCount, wrongCount, score, sourceFilter)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.startTime,
          session.endTime,
          session.totalQuestions,
          session.attemptedCount,
          session.correctCount,
          session.wrongCount,
          session.score,
          session.sourceFilter,
        ]
      );
      return;
    } catch (e) {
      console.warn('SQLite session insert error:', e);
    }
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
    const list: StoredPracticeSession[] = raw ? JSON.parse(raw) : [];
    list.unshift(session);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list.slice(0, 100)));
  } catch {}
}

export async function getAllPracticeSessions(): Promise<StoredPracticeSession[]> {
  const db = await initSQLite();
  if (db) {
    try {
      return db.getAllSync(
        `SELECT id, startTime, endTime, totalQuestions, attemptedCount, correctCount, wrongCount, score, sourceFilter
         FROM practice_sessions ORDER BY endTime DESC`
      );
    } catch {}
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------- COMPUTE AGGREGATE STATS ----------------

export async function getPerformanceStats(): Promise<PerformanceStats> {
  const attempts = await getAllAttempts();
  const sessions = await getAllPracticeSessions();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000; // 7 days window

  let totalCorrect = 0;
  let totalWrong = 0;
  let todayAttempts = 0;
  let thisWeekAttempts = 0;

  const uniqueQuestions = new Set<string>();

  const sectionStats = {
    generalAbility: { attempted: 0, correct: 0, accuracy: 0 },
    professionalAbility: { attempted: 0, correct: 0, accuracy: 0 },
  };

  for (const att of attempts) {
    uniqueQuestions.add(att.questionId);

    if (att.isCorrect) {
      totalCorrect += 1;
    } else {
      totalWrong += 1;
    }

    if (att.timestamp >= startOfToday) {
      todayAttempts += 1;
    }
    if (att.timestamp >= startOfWeek) {
      thisWeekAttempts += 1;
    }

    if (att.section === 'General Ability') {
      sectionStats.generalAbility.attempted += 1;
      if (att.isCorrect) sectionStats.generalAbility.correct += 1;
    } else {
      sectionStats.professionalAbility.attempted += 1;
      if (att.isCorrect) sectionStats.professionalAbility.correct += 1;
    }
  }

  const totalAttempts = totalCorrect + totalWrong;
  const accuracyRate =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  sectionStats.generalAbility.accuracy =
    sectionStats.generalAbility.attempted > 0
      ? Math.round(
          (sectionStats.generalAbility.correct /
            sectionStats.generalAbility.attempted) *
            100
        )
      : 0;

  sectionStats.professionalAbility.accuracy =
    sectionStats.professionalAbility.attempted > 0
      ? Math.round(
          (sectionStats.professionalAbility.correct /
            sectionStats.professionalAbility.attempted) *
            100
        )
      : 0;

  return {
    totalAttempts,
    totalCorrect,
    totalWrong,
    accuracyRate,
    uniqueQuestionsAttempted: uniqueQuestions.size,
    completedSessionsCount: sessions.length,
    todayAttempts,
    thisWeekAttempts,
    sectionStats,
  };
}

export async function getIncorrectAttemptQuestionIds(): Promise<string[]> {
  const attempts = await getAllAttempts();
  const wrongIds = new Set<string>();
  // Questions whose most recent attempt was incorrect
  const latestByQuestion = new Map<string, boolean>();
  for (const att of attempts) {
    if (!latestByQuestion.has(att.questionId)) {
      latestByQuestion.set(att.questionId, att.isCorrect);
      if (!att.isCorrect) {
        wrongIds.add(att.questionId);
      }
    }
  }
  return Array.from(wrongIds);
}

// ---------------- RESET / PURGE DATA ----------------

export async function clearAllUserData(): Promise<void> {
  const db = await initSQLite();
  if (db) {
    try {
      db.runSync(`DELETE FROM attempts`);
      db.runSync(`DELETE FROM bookmarks`);
      db.runSync(`DELETE FROM practice_sessions`);
    } catch {}
  }

  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ATTEMPTS,
      STORAGE_KEYS.BOOKMARKS,
      STORAGE_KEYS.SESSIONS,
    ]);
  } catch {}
}
