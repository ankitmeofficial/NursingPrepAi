/**
 * Native Android / iOS implementation using Expo SQLite.
 */
import * as SQLite from 'expo-sqlite';

let sqliteDb: SQLite.SQLiteDatabase | null = null;

export async function getNativeSQLiteDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (sqliteDb) return sqliteDb;

  try {
    sqliteDb = SQLite.openDatabaseSync('nursing_prep.db');
    sqliteDb.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY NOT NULL,
        questionId TEXT NOT NULL,
        paperId TEXT NOT NULL,
        section TEXT NOT NULL,
        selectedOptionIndex INTEGER NOT NULL,
        correctOptionIndex INTEGER NOT NULL,
        isCorrect INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        sessionId TEXT,
        mode TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_attempts_qid ON attempts(questionId);
      CREATE INDEX IF NOT EXISTS idx_attempts_time ON attempts(timestamp);

      CREATE TABLE IF NOT EXISTS bookmarks (
        questionId TEXT PRIMARY KEY NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS practice_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        totalQuestions INTEGER NOT NULL,
        attemptedCount INTEGER NOT NULL,
        correctCount INTEGER NOT NULL,
        wrongCount INTEGER NOT NULL,
        score REAL NOT NULL,
        sourceFilter TEXT NOT NULL
      );
    `);
    return sqliteDb;
  } catch (err) {
    console.warn('Native SQLite init error:', err);
    return null;
  }
}
