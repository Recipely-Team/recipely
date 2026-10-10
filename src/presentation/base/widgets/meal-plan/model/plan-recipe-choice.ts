import type { MealSlotType } from '@domain/diary/meal-slot';

/** The recipe the add sheet is planning — from a recipe page, or picked from Saved / My recipes / Search. */
export interface PlanRecipeChoice {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  /** Null when the recipe has no nutrition yet. */
  readonly caloriesPerServing: number | null;
  /** The meal its category suggests (`defaultMealForCategory`); null when unknown. */
  readonly meal: MealSlotType | null;
}
