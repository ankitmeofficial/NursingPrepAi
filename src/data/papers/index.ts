import { PaperSummary, QuestionPaper } from '@/types/paper';

// 2026 Papers
import { paperP1ECG2026Shift3 } from './p1-ecg-2026-s3';
import { paperP3Nursing2026Shift2 } from './p3-nursing-2026-s2';
import { paperP4Nursing2026Shift3 } from './p4-nursing-2026-s3';
import { paperP5Paramedical2026Shift2 } from './p5-paramedical-2026-s2';
import { paperP6Paramedical2026Shift3 } from './p6-paramedical-2026-s3';

// 2025 Nursing Superintendent Papers
import { paperNursingSuperintendent2025S1 } from './paper-nursing-superintendent-2025-shift-1';
import { paperNursingSuperintendent2025S2 } from './paper-nursing-superintendent-2025-shift-2';
import { paperNursingSuperintendent2025S3 } from './paper-nursing-superintendent-2025-shift-3';

// 2019 Staff Nurse Papers
import { paperStaffNurse2019Jul20Shift1 } from './rrb-staff-nurse-2019-jul-20-shift-1';
import { paperStaffNurse2019Jul20Shift2 } from './rrb-staff-nurse-2019-jul-20-shift-2';
import { paperStaffNurse2019Jul20Shift3 } from './rrb-staff-nurse-2019-jul-20-shift-3';
import { paperStaffNurse2019Jul21Shift2 } from './rrb-staff-nurse-2019-jul-21-shift-2';

// 2018 Staff Nurse Paper
import { paperRrbStaffNurse2018 } from './rrb-staff-nurse-2018';

// 2015 Staff Nurse Paper
import { paperRrbStaffNurse2015 } from './rrb-staff-nurse-2015';

/**
 * All processed and verified previous-year question papers.
 * Includes official RRB Nursing Superintendent, Staff Nurse, and Paramedical papers
 * spanning 2015 through 2026.
 */
const ALL_PAPERS: QuestionPaper[] = [
  // 2026 Nursing Superintendent (Core target for RRB Nursing)
  paperP3Nursing2026Shift2,
  paperP4Nursing2026Shift3,
  // 2026 Paramedical papers
  paperP1ECG2026Shift3,
  paperP5Paramedical2026Shift2,
  paperP6Paramedical2026Shift3,

  // 2025 Nursing Superintendent Papers
  paperNursingSuperintendent2025S1,
  paperNursingSuperintendent2025S2,
  paperNursingSuperintendent2025S3,

  // 2019 Staff Nurse Papers
  paperStaffNurse2019Jul20Shift1,
  paperStaffNurse2019Jul20Shift2,
  paperStaffNurse2019Jul20Shift3,
  paperStaffNurse2019Jul21Shift2,

  // 2018 Staff Nurse Paper
  paperRrbStaffNurse2018,

  // 2015 Staff Nurse Paper
  paperRrbStaffNurse2015,
];

/**
 * Returns all available question papers in chronological order (latest year first).
 * Within the same year, papers are ordered with Nursing papers first (Superintendent / Staff Nurse).
 */
export function getAllPapers(): QuestionPaper[] {
  return [...ALL_PAPERS].sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year; // Latest year first
    }
    // Prioritize Nursing (Superintendent or Staff Nurse) over others within the same year
    const aIsNursing = a.post.toLowerCase().includes('nurs');
    const bIsNursing = b.post.toLowerCase().includes('nurs');
    if (aIsNursing && !bIsNursing) return -1;
    if (!aIsNursing && bIsNursing) return 1;
    return a.code.localeCompare(b.code);
  });
}

/**
 * Returns papers for a specific year, or an empty array if no papers exist for that year.
 * No fake entries are created.
 */
export function getPapersByYear(year: number): QuestionPaper[] {
  return getAllPapers().filter((paper) => paper.year === year);
}

/**
 * Finds a specific question paper by its unique ID.
 */
export function getPaperById(id: string): QuestionPaper | undefined {
  return ALL_PAPERS.find((paper) => paper.id === id);
}

/**
 * Returns a list of distinct years that actually have processed papers available.
 */
export function getAvailableYears(): number[] {
  const years = Array.from(new Set(ALL_PAPERS.map((p) => p.year)));
  return years.sort((a, b) => b - a);
}

/**
 * Generates a lightweight summary for listing screens.
 */
export function toPaperSummary(paper: QuestionPaper): PaperSummary {
  return {
    id: paper.id,
    code: paper.code,
    year: paper.year,
    examName: paper.examName,
    sessionLabel: paper.sessionLabel,
    examDate: paper.examDate,
    post: paper.post,
    durationMinutes: paper.durationMinutes,
    totalQuestions: paper.totalQuestions,
    generalAbilityCount: paper.generalAbilityCount,
    professionalAbilityCount: paper.professionalAbilityCount,
    language: paper.language,
  };
}
