import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants, ValueConstants } from '@core/constants';
import { datePart } from '@presentation/app/diary/model/assistant/date-part';
import type { DiaryDayView } from '@presentation/app/diary/model/diary-day-view';

const NEWLINE = CharConstants.newline;
const round = (value: number): number => Math.round(value);
const grams = (value: number | null): string => (value === null ? 'unknown' : String(round(value)));

const dayLines = (day: DiaryDay): string[] => {
  const { totals, goals } = day;
  return [
    `kcal eaten=${round(totals.calories)} goal=${goals.calories} remaining=${round(day.remainingCalories)} status=${day.calorieStatus}`,
    `protein ${grams(totals.protein)}/${goals.protein} g; carbs ${grams(totals.carbs)}/${goals.carbs} g; fat ${grams(totals.fat)}/${goals.fat} g; fiber ${grams(totals.fiber)}/${goals.fiber} g`,
    `water ${day.waterGlasses}/${goals.waterGlasses} glasses`,
    ...day.mealGroups.map((group) =>
      group.entries.length === ValueConstants.zero
        ? `${group.meal} 0 kcal: none`
        : `${group.meal} ${round(group.totals.calories)} kcal: ${group.entries
            .map((entry, i) => `${i + ValueConstants.one}) ${entry.name}, ${entry.servings} serving(s), ${round(entry.nutrients.calories)} kcal`)
            .join(', ')}`,
    ),
    `goals: ${goals.calories} kcal, protein ${goals.protein} g, carbs ${goals.carbs} g, fat ${goals.fat} g, fiber ${goals.fiber} g, water ${goals.waterGlasses} glasses`,
  ];
};

/**
 * The Day view read out for `readScreen` (docs/diary-assistant-contract.md):
 * today and the selected day, the calorie and macro totals against the goals,
 * water, every meal with its entries, and the goals — what lets the assistant
 * comment on the user's day.
 */
export const diaryDayReading = (view: DiaryDayView, selected: CalendarDate, today: CalendarDate, locale: string): string => {
  const head = [`screen=diary`, datePart('today', today, locale), datePart('selected', selected, locale)];
  switch (view.status) {
    case StoreStatus.Loaded:
      return [...head, ...dayLines(view.day)].join(NEWLINE);
    case StoreStatus.Error:
      return [...head, 'day: failed to load'].join(NEWLINE);
    case StoreStatus.Loading:
      return [...head, 'day: loading'].join(NEWLINE);
  }
};
