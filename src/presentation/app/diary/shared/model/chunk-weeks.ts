import type { CalendarDate } from '@domain/diary/calendar/calendar-date';

const DAYS_PER_WEEK = 7;

/** Grid cells in rows of seven, the last row padded with blanks so every column keeps its width. */
export const chunkWeeks = (cells: readonly (CalendarDate | null)[]): (CalendarDate | null)[][] => {
  const rows: (CalendarDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_PER_WEEK) {
    const row = cells.slice(i, i + DAYS_PER_WEEK);
    while (row.length < DAYS_PER_WEEK) row.push(null);
    rows.push(row);
  }
  return rows;
};
