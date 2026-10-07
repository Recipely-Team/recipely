import type { Result } from '@core/result/result';
import type { ValidationFailure } from '@core/failure';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

/** Turns a recipe into one serving of food the Add food sheet can log; the rules live in `LoggableFood.fromRecipe`. */
export class BuildLoggableFoodFromRecipeUseCase {
  execute(recipe: RecipeEntity): Result<LoggableFood, ValidationFailure> {
    return LoggableFood.fromRecipe(recipe);
  }
}
