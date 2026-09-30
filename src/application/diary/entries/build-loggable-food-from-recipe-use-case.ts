import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

/** The recipe API sends 0 for "never filled in" as well as a measured zero (see `NutritionFacts`). */
const reported = (value: number | undefined): number | null =>
  value !== undefined && value > ValueConstants.zero ? value : null;

/**
 * Turns a recipe into one serving of food the Add food sheet can log.
 *
 * @remarks
 * - **Needs calories.** A recipe without `caloriesPerServing > 0` cannot be
 *   logged (the detail screen hides "Add to diary" for it); this refuses it too.
 * - **Calories-only recipes give null macros**, so the entry counts toward
 *   kcal and the UI shows "calories only" (design spec §3).
 * - Synchronous: no I/O, the recipe is already loaded.
 */
export class BuildLoggableFoodFromRecipeUseCase {
  execute(recipe: RecipeEntity): Result<LoggableFood, ValidationFailure> {
    const calories = reported(recipe.caloriesPerServing);
    if (calories === null) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.recipeWithoutCalories, 'caloriesPerServing'));
    }
    const nutrition = recipe.nutrition;
    const perServing = Nutrients.create({
      calories,
      protein: reported(nutrition?.protein),
      carbs: reported(nutrition?.carbs),
      fat: reported(nutrition?.fat),
      fiber: reported(nutrition?.fiber),
    });
    if (!perServing.ok) return perServing;
    const imageUrl = recipe.image.length > ValueConstants.zero ? recipe.image : null;
    return ok(LoggableFood.of({ name: recipe.name, perServing: perServing.value, recipeId: recipe.id, imageUrl }));
  }
}
