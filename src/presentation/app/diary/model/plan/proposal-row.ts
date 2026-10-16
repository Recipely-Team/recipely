import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { PlannedRecipe } from '@domain/meal-plan/planned-recipe';

/** One open meal in the proposal, with the recipe currently shown (the pick, or its swap). */
export interface ProposalRow {
  readonly key: string;
  readonly date: CalendarDate;
  readonly meal: MealSlotType;
  /** Null when no saved recipe fits: the row says "save more recipes". */
  readonly shown: PlannedRecipe | null;
  /** The other recipe Swap toggles to; null when there is none. */
  readonly other: PlannedRecipe | null;
  readonly swapped: boolean;
}
