import { getAllPapers, getPaperById } from '@/data/papers';
import { Question, SectionType } from '@/types/paper';

export interface QuestionFilterOptions {
  section?: SectionType;
  nursingOnly?: boolean;
  paperId?: string;
  excludeIds?: string[];
}

/**
 * Returns all verified questions across all processed papers.
 */
export function getAllQuestions(): Question[] {
  const papers = getAllPapers();
  const all: Question[] = [];
  for (const p of papers) {
    for (const q of p.questions) {
      all.push({
        ...q,
        paperId: p.id,
        year: p.year,
        examName: p.examName,
      });
    }
  }
  return all;
}

/**
 * Returns filtered questions based on criteria.
 */
export function getFilteredQuestions(options?: QuestionFilterOptions): Question[] {
  let questions: Question[] = [];

  if (options?.paperId) {
    const paper = getPaperById(options.paperId);
    questions = paper ? [...paper.questions] : [];
  } else if (options?.nursingOnly) {
    const papers = getAllPapers().filter((p) =>
      p.post.toLowerCase().includes('nurs')
    );
    for (const p of papers) {
      questions.push(...p.questions);
    }
  } else {
    questions = getAllQuestions();
  }

  if (options?.section) {
    questions = questions.filter((q) => q.section === options.section);
  }

  if (options?.excludeIds && options.excludeIds.length > 0) {
    const excludeSet = new Set(options.excludeIds);
    questions = questions.filter((q) => !excludeSet.has(q.id));
  }

  return questions;
}

/**
 * Fisher-Yates array shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Selects randomized, non-repeating questions for practice or reels.
 * Guarantees NO duplicate questions within the returned set.
 * Excludes incomplete OCR placeholders to guarantee valid question practice.
 */
export function getRandomQuestions(
  requestedCount: number,
  options?: QuestionFilterOptions
): { questions: Question[]; requestedCount: number; actualCount: number } {
  const pool = getFilteredQuestions(options).filter(
    (q) => q.correctOptionIndex >= 0 && !q.text.startsWith('[OCR')
  );
  const shuffled = shuffleArray(pool);
  const actualCount = Math.min(requestedCount, shuffled.length);
  const selected = shuffled.slice(0, actualCount);

  return {
    questions: selected,
    requestedCount,
    actualCount,
  };
}

/**
 * Looks up questions by an array of question IDs.
 */
export function getQuestionsByIds(ids: string[]): Question[] {
  const all = getAllQuestions();
  const idMap = new Map<string, Question>();
  for (const q of all) {
    idMap.set(q.id, q);
  }
  const result: Question[] = [];
  for (const id of ids) {
    const found = idMap.get(id);
    if (found) result.push(found);
  }
  return result;
}

/**
 * Look up a single question by ID.
 */
export function getQuestionById(id: string): Question | undefined {
  const all = getAllQuestions();
  return all.find((q) => q.id === id);
}
