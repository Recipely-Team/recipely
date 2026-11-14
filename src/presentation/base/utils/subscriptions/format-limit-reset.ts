import { ValueConstants } from '@core/constants';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { TranslationsType } from '@presentation/i18n';

/**
 * When the AI limit resets, in the reader's language and time zone:
 * "Today, 00:00", "Tomorrow, 12:00 AM", or "Dec 1, 12:00 AM".
 * The time is the server's `resetsAt`; only its wording is local.
 */
export const formatLimitReset = (t: TranslationsType, resetsAt: Date, today: CalendarDate, locale: string): string => {
  const copy = t.aiLimit;
  const time = resetsAt.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  const day = CalendarDate.fromLocalDate(resetsAt);
  if (day.value === today.value) return copy.today.replace('{time}', time);
  if (day.value === today.addDays(ValueConstants.one).value) return copy.tomorrow.replace('{time}', time);
  const date = resetsAt.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return copy.onDate.replace('{date}', date).replace('{time}', time);
};
