/**
 * Configuration for Previous-Year Question Papers.
 * The year range is fully configurable here.
 * Adding earlier (e.g. 2012) or later (e.g. 2027) years in the future
 * only requires updating startYear and endYear here.
 */

export interface YearRangeConfig {
  startYear: number;
  endYear: number;
}

export const PAPER_YEAR_RANGE_CONFIG: YearRangeConfig = {
  startYear: 2015,
  endYear: 2026,
};

/**
 * Returns all years in the configured range in descending chronological order
 * (latest year first, e.g., 2026, 2025, ..., 2015).
 */
export function getConfiguredYearRange(config = PAPER_YEAR_RANGE_CONFIG): number[] {
  const years: number[] = [];
  for (let y = config.endYear; y >= config.startYear; y--) {
    years.push(y);
  }
  return years;
}
