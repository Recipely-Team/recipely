import { CalendarDate } from '@domain/diary/calendar/calendar-date';

const date = (raw: string): CalendarDate => {
  const created = CalendarDate.create(raw);
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};

describe('CalendarDate', () => {
  it('accepts a real YYYY-MM-DD and refuses anything else', () => {
    expect(date('2026-09-30').value).toBe('2026-09-30');
    expect(CalendarDate.create('2026-02-30').ok).toBe(false);
    expect(CalendarDate.create('2026-9-30').ok).toBe(false);
    expect(CalendarDate.create('2026-09-30T00:00').ok).toBe(false);
    expect(date('2028-02-29').day).toBe(29);
  });

  it('reads a local Date without shifting it to UTC — just after midnight and just before', () => {
    expect(CalendarDate.fromLocalDate(new Date(2026, 8, 30, 0, 30)).value).toBe('2026-09-30');
    expect(CalendarDate.fromLocalDate(new Date(2026, 8, 30, 23, 59)).value).toBe('2026-09-30');
    expect(CalendarDate.today(new Date(2027, 0, 1, 0, 5)).value).toBe('2027-01-01');
  });

  it('round-trips through toLocalDate at local midnight', () => {
    const local = date('2026-03-29').toLocalDate();
    expect([local.getFullYear(), local.getMonth(), local.getDate(), local.getHours()]).toEqual([2026, 2, 29, 0]);
  });

  it('starts the week on Monday', () => {
    expect(date('2026-09-30').weekday).toBe(2);
    expect(date('2026-09-30').weekStart().value).toBe('2026-09-28');
    expect(date('2026-10-04').weekStart().value).toBe('2026-09-28');
    expect(date('2026-09-28').weekStart().value).toBe('2026-09-28');
    expect(date('2026-10-01').weekDays().map((d) => d.value)).toEqual([
      '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
    ]);
  });

  it('adds days across month, year and DST boundaries', () => {
    expect(date('2026-09-30').addDays(1).value).toBe('2026-10-01');
    expect(date('2026-12-31').addDays(1).value).toBe('2027-01-01');
    expect(date('2026-03-28').addDays(2).value).toBe('2026-03-30');
    expect(date('2026-10-24').addDays(2).value).toBe('2026-10-26');
    expect(date('2026-03-01').addDays(-1).value).toBe('2026-02-28');
  });

  it('orders and measures dates', () => {
    expect(date('2026-09-29').isBefore(date('2026-09-30'))).toBe(true);
    expect(date('2026-09-30').isAfter(date('2026-09-29'))).toBe(true);
    expect(date('2026-09-01').daysUntil(date('2026-10-01'))).toBe(30);
    expect(date('2026-09-30').equals(CalendarDate.of(2026, 9, 30))).toBe(true);
  });
});
