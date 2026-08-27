import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { ValueConstants } from '@core/constants';

/**
 * The facts printed beside a recipe, as screen-line parts.
 *
 * @remarks
 * - **Why the assistant needs them at all.** "Besin değerleri ve hazırlık
 *   sürelerini okuyamıyor" — the screen line carried the recipe's name, whether
 *   it was saved, and a step count, so the model had no way to answer a
 *   question the screen was answering in print.
 * - **On the line rather than behind an action.** These are asked with both
 *   hands busy, and a round trip to fetch them is a round trip the cook waits
 *   through. They are a few dozen characters; the recipe TEXT is the thing that
 *   must stay out of the context, not its numbers.
 * - **Absent facts are omitted, not zeroed.** Not every recipe has nutrition,
 *   and `protein=0` is a claim the app cannot support.
 */
export const recipeFacts = (recipe: RecipeEntity | null): readonly string[] => {
  if (recipe === null) return [];

  const parts = [
    `prepMin=${recipe.prepTimeMinutes}`,
    `cookMin=${recipe.cookTimeMinutes}`,
    `serves=${recipe.servings}`,
    `difficulty=${recipe.difficulty}`,
  ];

  if (recipe.caloriesPerServing > ValueConstants.zero) {
    parts.push(`kcalPerServing=${recipe.caloriesPerServing}`);
  }
  const nutrition = recipe.nutrition;
  if (nutrition !== undefined) {
    for (const [name, value] of Object.entries(nutrition)) {
      if (typeof value === 'number') parts.push(`${name}=${value}`);
    }
  }
  return parts;
};
