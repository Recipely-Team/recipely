import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';

const ISO_MONTH = /^(\d{4})-(\d{2})$/;
/** `YYYY-MM` is the first seven characters of `YYYY-MM-DD`. */
const MONTH_KEY_LENGTH = 7;

/**
 * A calendar month, `YYYY-MM` — the key the month view and its cache use.
 *
 * @remarks
 * - **Built on `CalendarDate`**, so it inherits the no-time-zone rule: the
 *   first day is `YYYY-MM-01` everywhere on Earth.
 * - **`days()` is the month's dates only.** Leading blanks for a Monday-first
 *   grid are `firstDay.weekday` cells — a layout concern, left to the screen.
 */
export class CalendarMonth extends BaseValueObject<string> {
  private constructor(private readonly first: CalendarDate) {
    super(first.value.slice(ValueConstants.zero, MONTH_KEY_LENGTH));
  }

  static create(raw: string): Result<CalendarMonth, ValidationFailure> {
    const match = ISO_MONTH.exec(raw);
    const month = match === null ? null : CalendarMonth.of(CalendarDate.of(Number(match[1]), Number(match[2]), ValueConstants.one));
    if (month === null || month.value !== raw) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.monthInvalid(raw), 'month'));
    }
    return ok(month);
  }

  /** The month a date falls in. */
  static of(date: CalendarDate): CalendarMonth {
    return new CalendarMonth(CalendarDate.of(date.year, date.month, ValueConstants.one));
  }

  get year(): number {
    return this.first.year;
  }

  /** 1-based. */
  get month(): number {
    return this.first.month;
  }

  get firstDay(): CalendarDate {
    return this.first;
  }

  get lastDay(): CalendarDate {
    return this.addMonths(ValueConstants.one).firstDay.addDays(ValueConstants.minusOne);
  }

  get dayCount(): number {
    return this.lastDay.day;
  }

  days(): CalendarDate[] {
    return Array.from({ length: this.dayCount }, (_, i) => this.first.addDays(i));
  }

  contains(date: CalendarDate): boolean {
    return date.year === this.year && date.month === this.month;
  }

  addMonths(months: number): CalendarMonth {
    return new CalendarMonth(CalendarDate.of(this.year, this.month + months, ValueConstants.one));
  }

  isBefore(other: CalendarMonth): boolean {
    return this.first.isBefore(other.first);
  }

  isAfter(other: CalendarMonth): boolean {
    return this.first.isAfter(other.first);
  }
}
