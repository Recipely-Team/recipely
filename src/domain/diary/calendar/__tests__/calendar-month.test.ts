import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';

const month = (raw: string): CalendarMonth => {
  const created = CalendarMonth.create(raw);
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};

describe('CalendarMonth', () => {
  it('accepts YYYY-MM only', () => {
    expect(month('2026-09').value).toBe('2026-09');
    expect(CalendarMonth.create('2026-13').ok).toBe(false);
    expect(CalendarMonth.create('2026-9').ok).toBe(false);
  });

  it('knows its bounds, including a leap February', () => {
    expect(month('2026-09').firstDay.value).toBe('2026-09-01');
    expect(month('2026-09').lastDay.value).toBe('2026-09-30');
    expect(month('2028-02').dayCount).toBe(29);
    expect(month('2026-02').dayCount).toBe(28);
    expect(month('2026-09').days()).toHaveLength(30);
    expect(month('2026-09').firstDay.weekday).toBe(1);
  });

  it('is the month of a date, and contains only its own days', () => {
    const september = CalendarMonth.of(CalendarDate.of(2026, 9, 30));
    expect(september.value).toBe('2026-09');
    expect(september.contains(CalendarDate.of(2026, 9, 1))).toBe(true);
    expect(september.contains(CalendarDate.of(2026, 10, 1))).toBe(false);
  });

  it('steps across years', () => {
    expect(month('2026-01').addMonths(-1).value).toBe('2025-12');
    expect(month('2026-12').addMonths(1).value).toBe('2027-01');
    expect(month('2026-10').isAfter(month('2026-09'))).toBe(true);
  });
});
