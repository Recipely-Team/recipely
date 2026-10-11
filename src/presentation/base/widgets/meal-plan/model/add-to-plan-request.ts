import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { PlanRecipeChoice } from '@presentation/base/widgets/meal-plan/model/plan-recipe-choice';

/** What the add-to-plan sheet opens on; null closes it. */
export interface AddToPlanRequest {
  /** Locked from a recipe page; null starts on the recipe picker. */
  readonly recipe: PlanRecipeChoice | null;
  /** The day to start on; a day that has passed starts on today. */
  readonly date: CalendarDate;
  /** The slot tapped; null lets the recipe's category decide. */
  readonly meal: MealSlotType | null;
}
