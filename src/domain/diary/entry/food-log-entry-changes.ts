import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';

/**
 * An edit to a logged entry; at least one field is set. The server rescales
 * the entry's nutrients when `servings` changes — the client never sends them.
 */
export interface FoodLogEntryChanges {
  readonly meal?: MealSlotType;
  readonly servings?: number;
  readonly date?: CalendarDate;
}
