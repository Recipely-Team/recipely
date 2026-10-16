import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { PlannedRecipe } from '@domain/meal-plan/planned-recipe';

/** One open meal of a drafted week: the pick and the one swap, either null when nothing fits. */
export interface SuggestedSlot {
  readonly date: CalendarDate;
  readonly meal: MealSlotType;
  readonly pick: PlannedRecipe | null;
  readonly alternative: PlannedRecipe | null;
}
