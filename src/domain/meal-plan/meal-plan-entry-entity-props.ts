import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Servings } from '@domain/diary/entry/servings';
import type { PlannedRecipe } from '@domain/meal-plan/planned-recipe';

export interface MealPlanEntryEntityProps {
  id: string;
  date: CalendarDate;
  meal: MealSlotType;
  /** Order within the day's meal, 0–999. */
  position: number;
  servings: Servings;
  eaten: boolean;
  /** The diary entry "mark as eaten" wrote; null while not eaten. */
  foodLogEntryId: string | null;
  recipe: PlannedRecipe;
}
