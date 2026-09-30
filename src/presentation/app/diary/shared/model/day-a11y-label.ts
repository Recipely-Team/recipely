import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalorieStatus, type CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { statusLabel } from '@presentation/app/diary/shared/model/status-label';
import { t } from '@presentation/i18n';

/**
 * What a screen reader says for a date cell: "27 September Sunday: 2,269
 * kcal, Over goal", or "…: Nothing logged" — the status in words, since the
 * cell shows it by colour and shape (design spec → Food Diary §2.1, §9).
 */
export const dayA11yLabel = (date: CalendarDate, calories: number, status: CalorieStatusType, locale: string): string => {
  const spokenDate = date.toLocalDate().toLocaleDateString(locale, { day: 'numeric', month: 'long', weekday: 'long' });
  const strings = t().diary;
  if (status === CalorieStatus.None) {
    return strings.dayEmptyA11y.replace('{date}', spokenDate).replace('{status}', statusLabel(status));
  }
  return strings.dayA11y
    .replace('{date}', spokenDate)
    .replace('{kcal}', formatWholeNumber(calories, locale))
    .replace('{status}', statusLabel(status));
};
