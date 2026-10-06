import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { CharConstants, TimeConstants, ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_WIDTH = 4;
const PART_WIDTH = 2;
const PAD = '0';
const DAYS_PER_WEEK = 7;
/** `getUTCDay()` counts from Sunday; the diary's week starts on Monday. */
const SUNDAY_TO_MONDAY_SHIFT = 6;
const MS_PER_DAY =
  TimeConstants.hoursPerDay * TimeConstants.minutesPerHour * TimeConstants.secondsPerMinute * TimeConstants.millisecondsPerSecond;

const pad = (n: number, width: number): string => String(n).padStart(width, PAD);

const format = (utcMs: number): string => {
  const d = new Date(utcMs);
  return [
    pad(d.getUTCFullYear(), YEAR_WIDTH),
    pad(d.getUTCMonth() + ValueConstants.one, PART_WIDTH),
    pad(d.getUTCDate(), PART_WIDTH),
  ].join(CharConstants.dash);
};

/**
 * A day on the user's calendar, `YYYY-MM-DD`, with no time and no time zone.
 *
 * @remarks
 * - **Local, never UTC-shifted.** `fromLocalDate` reads the device's local
 *   year/month/day; `toISOString().slice(0, 10)` would log a 00:30 breakfast
 *   on the previous day for anyone east of Greenwich.
 * - **Arithmetic runs on a UTC epoch-day count** purely as a calendar: no
 *   instant ever leaves this class, so DST and offsets cannot move a day.
 * - **Weeks start on Monday** (design spec §4); `weekday` is 0 = Monday.
 * - **String order is date order**, which is what `compare` relies on.
 */
export class CalendarDate extends BaseValueObject<string> {
  private constructor(private readonly utcMs: number) {
    super(format(utcMs));
  }

  static create(raw: string): Result<CalendarDate, ValidationFailure> {
    const match = ISO_DATE.exec(raw);
    const date = match === null ? null : CalendarDate.of(Number(match[ValueConstants.one]), Number(match[ValueConstants.two]), Number(match[ValueConstants.three]));
    if (date === null || date.value !== raw) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.dateInvalid(raw), 'date'));
    }
    return ok(date);
  }

  /** Month is 1-based. Out-of-range parts roll over (`of(2026, 13, 1)` is 2027-01-01). */
  static of(year: number, month: number, day: number): CalendarDate {
    return new CalendarDate(Date.UTC(year, month - ValueConstants.one, day));
  }

  static fromLocalDate(date: Date): CalendarDate {
    return CalendarDate.of(date.getFullYear(), date.getMonth() + ValueConstants.one, date.getDate());
  }

  static today(now: Date = new Date()): CalendarDate {
    return CalendarDate.fromLocalDate(now);
  }

  get year(): number {
    return new Date(this.utcMs).getUTCFullYear();
  }

  /** 1-based. */
  get month(): number {
    return new Date(this.utcMs).getUTCMonth() + ValueConstants.one;
  }

  get day(): number {
    return new Date(this.utcMs).getUTCDate();
  }

  /** 0 = Monday … 6 = Sunday. */
  get weekday(): number {
    return (new Date(this.utcMs).getUTCDay() + SUNDAY_TO_MONDAY_SHIFT) % DAYS_PER_WEEK;
  }

  addDays(days: number): CalendarDate {
    return new CalendarDate(this.utcMs + days * MS_PER_DAY);
  }

  /** The Monday of this date's week. */
  weekStart(): CalendarDate {
    return this.addDays(-this.weekday);
  }

  /** Monday to Sunday of this date's week. */
  weekDays(): CalendarDate[] {
    const monday = this.weekStart();
    return Array.from({ length: DAYS_PER_WEEK }, (_, i) => monday.addDays(i));
  }

  /** Whole days from this date to `other`; negative when `other` is earlier. */
  daysUntil(other: CalendarDate): number {
    return Math.round((other.utcMs - this.utcMs) / MS_PER_DAY);
  }

  compare(other: CalendarDate): number {
    return this.utcMs - other.utcMs;
  }

  isBefore(other: CalendarDate): boolean {
    return this.utcMs < other.utcMs;
  }

  isAfter(other: CalendarDate): boolean {
    return this.utcMs > other.utcMs;
  }

  /** Local midnight of this day — for `Intl` formatting, never for arithmetic. */
  toLocalDate(): Date {
    return new Date(this.year, this.month - ValueConstants.one, this.day);
  }
}
