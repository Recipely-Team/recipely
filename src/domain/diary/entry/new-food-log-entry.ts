import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';

/**
 * A food about to be logged. `nutrients` are for the whole amount (already
 * multiplied by `servings`) — the snapshot the entry will keep. Build it with
 * `LoggableFood.entryFor` rather than by hand.
 */
export interface NewFoodLogEntry {
  readonly date: CalendarDate;
  readonly meal: MealSlotType;
  readonly name: string;
  readonly servings: number;
  readonly nutrients: Nutrients;
  readonly recipeId: string | null;
}
