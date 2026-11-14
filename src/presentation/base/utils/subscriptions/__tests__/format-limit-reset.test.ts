import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { en } from '@presentation/i18n/locales/en';
import { formatLimitReset } from '@presentation/base/utils/subscriptions/format-limit-reset';

const today = CalendarDate.of(2026, 11, 14);
const at = (day: number) => new Date(2026, 10, day, 0, 0);

describe('formatLimitReset', () => {
  it('names today and tomorrow, and dates anything later', () => {
    expect(formatLimitReset(en, at(14), today, 'en-US')).toMatch(/^Today, /);
    expect(formatLimitReset(en, at(15), today, 'en-US')).toMatch(/^Tomorrow, 12:00\sAM$/);
    expect(formatLimitReset(en, new Date(2026, 11, 1, 0, 0), today, 'en-US')).toMatch(/^Dec 1, 12:00\sAM$/);
  });
});
