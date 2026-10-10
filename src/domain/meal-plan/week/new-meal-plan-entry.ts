import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Servings } from '@domain/diary/entry/servings';

/** A meal to plan — what `POST /me/meal-plan/entries` takes. */
export interface NewMealPlanEntry {
  readonly date: CalendarDate;
  readonly meal: MealSlotType;
  readonly recipeId: string;
  readonly servings: Servings;
}
