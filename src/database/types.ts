export interface StoredAttempt {
  id: string;
  questionId: string;
  paperId: string;
  section: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  timestamp: number; // Unix ms
  sessionId?: string;
  mode: 'paper' | 'practice' | 'reels';
}

export interface StoredBookmark {
  questionId: string;
  timestamp: number;
}

export interface StoredPracticeSession {
  id: string;
  startTime: number;
  endTime: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  sourceFilter: string;
}

export interface PerformanceStats {
  totalAttempts: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number; // percentage 0 - 100
  uniqueQuestionsAttempted: number;
  completedSessionsCount: number;
  todayAttempts: number;
  thisWeekAttempts: number;
  sectionStats: {
    generalAbility: { attempted: number; correct: number; accuracy: number };
    professionalAbility: { attempted: number; correct: number; accuracy: number };
  };
}
