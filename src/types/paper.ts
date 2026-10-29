export type SectionType = 'General Ability' | 'Professional Ability';

export interface Question {
  id: string;
  questionNumber: number;
  section: SectionType;
  marks: number;
  negativeMarks?: number;
  text: string;
  options: [string, string, string, string];
  /** 0-based index of the correct option: 0 = (1), 1 = (2), 2 = (3), 3 = (4) */
  correctOptionIndex: number;
  correctAnswerText: string;
  explanation?: string;
  topic?: string;
  notes?: string;
  paperId?: string;
  year?: number;
  examName?: string;
}

export interface QuestionPaper {
  id: string;
  code: string;
  year: number;
  examName: string;
  sessionLabel: string;
  examDate: string;
  post: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  generalAbilityCount: number;
  professionalAbilityCount: number;
  language: string;
  sourceFile: string;
  questions: Question[];
}

export interface PaperSummary {
  id: string;
  code: string;
  year: number;
  examName: string;
  sessionLabel: string;
  examDate: string;
  post: string;
  durationMinutes: number;
  totalQuestions: number;
  generalAbilityCount: number;
  professionalAbilityCount: number;
  language: string;
}
