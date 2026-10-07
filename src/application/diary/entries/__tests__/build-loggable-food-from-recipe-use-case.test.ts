import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { BuildLoggableFoodFromRecipeUseCase } from '@application/diary/entries/build-loggable-food-from-recipe-use-case';

describe('BuildLoggableFoodFromRecipeUseCase', () => {
  it('delegates to LoggableFood.fromRecipe', () => {
    const r = new BuildLoggableFoodFromRecipeUseCase().execute(recipeEntityOf({ caloriesPerServing: 350 }));
    expect(r.ok && r.value.recipeId).toBe('recipe-1');
    expect(r.ok && r.value.perServing.calories).toBe(350);
  });
});
