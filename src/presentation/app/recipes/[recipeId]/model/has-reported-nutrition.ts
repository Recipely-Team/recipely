import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { ValueConstants } from '@core/constants';

/**
 * Whether the backend reported ANY nutrition figure for this recipe.
 *
 * @remarks
 * - **Zero is absence, not a measurement.** The API sends `0` both for
 *   "measured as zero" and for "never filled in", and some recipes arrive with
 *   calories but every macro at 0. A figure only counts when it is positive —
 *   the same rule the tiles use to decide between a number and an em dash.
 * - **One definition, because there were two and they disagreed.** The mobile
 *   card counted fibre and the web sidebar did not, so a recipe carrying only
 *   fibre showed tiles on a phone and "no nutritional info yet" in a browser.
 *   Neither was wrong on its own; having two was (CLAUDE.md rule 5).
 * - **Takes the pieces, not the entity.** The mobile card is handed
 *   `caloriesPerServing` and `nutrition` as separate props and has no recipe to
 *   pass, and widening its props to take one just to reach this would couple a
 *   presentational card to the aggregate.
 */
export const hasReportedNutrition = (
  caloriesPerServing: number,
  nutrition: RecipeNutrition | undefined,
): boolean =>
  [caloriesPerServing, nutrition?.protein, nutrition?.carbs, nutrition?.fat, nutrition?.fiber].some(
    (value) => value !== undefined && value > ValueConstants.zero,
  );
