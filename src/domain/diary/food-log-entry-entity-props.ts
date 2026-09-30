import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';

export interface FoodLogEntryEntityProps {
  id: string;
  date: CalendarDate;
  meal: MealSlotType;
  name: string;
  servings: number;
  /** For the whole logged amount, snapshotted at log time. */
  nutrients: Nutrients;
  /** The recipe it was logged from, by id only (rule 20); null for a quick add. */
  recipeId: string | null;
  recipeImageUrl: string | null;
}
