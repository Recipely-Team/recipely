import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Servings } from '@domain/diary/entry/servings';

/** An edit to a planned meal; at least one field is set. A move without `position` lands at the end of its new slot. */
export interface MealPlanEntryChanges {
  readonly date?: CalendarDate;
  readonly meal?: MealSlotType;
  readonly servings?: Servings;
  readonly position?: number;
}
