import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { BuildLoggableFoodFromRecipeUseCase } from '@application/diary/entries/build-loggable-food-from-recipe-use-case';

const build = new BuildLoggableFoodFromRecipeUseCase();

describe('BuildLoggableFoodFromRecipeUseCase', () => {
  it('takes calories and macros per serving from the recipe', () => {
    const r = build.execute(recipeEntityOf({ caloriesPerServing: 350, nutrition: { protein: 20, carbs: 40, fat: 10, fiber: 6 } }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.perServing.value).toEqual({ calories: 350, protein: 20, carbs: 40, fat: 10, fiber: 6 });
    expect(r.value.recipeId).toBe('recipe-1');
    expect(r.value.imageUrl).toBe('https://cdn.example.test/cover.jpg');
  });

  it('gives a calories-only recipe null macros, treating a reported 0 as absent', () => {
    const r = build.execute(recipeEntityOf({ caloriesPerServing: 250, nutrition: { protein: 0 } }));
    expect(r.ok && r.value.perServing.hasMacros).toBe(false);
    expect(r.ok && r.value.perServing.fiber).toBeNull();
  });

  it('refuses a recipe without calories', () => {
    expect(build.execute(recipeEntityOf({ caloriesPerServing: 0 })).ok).toBe(false);
  });
});
