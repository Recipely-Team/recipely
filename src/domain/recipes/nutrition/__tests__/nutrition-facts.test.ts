import { NutritionFacts } from '@domain/recipes/nutrition/nutrition-facts';
import { NutritionBasis } from '@domain/recipes/nutrition/nutrition-basis';
import { NutritionMacro } from '@domain/recipes/nutrition/nutrition-macro';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';

const factsOf = (caloriesPerServing: number, nutrition: RecipeNutrition | undefined, servings = 4): NutritionFacts =>
  NutritionFacts.of({ caloriesPerServing, servings, nutrition });

describe('NutritionFacts', () => {
  const nutrition = { protein: 24, carbs: 60, fat: 18, fiber: 6, servingWeightGrams: 400 };

  it('returns per-serving figures unchanged on the serving basis', () => {
    const reading = factsOf(520, nutrition).read(NutritionBasis.PerServing);

    expect(reading.basis).toBe(NutritionBasis.PerServing);
    expect(reading.calories).toBe(520);
    expect(reading.macros.map((m) => m.grams)).toEqual([24, 60, 18, 6]);
    expect(reading.totalCalories).toBe(2080);
  });

  it('scales to 100 g using the serving weight, with the design rounding', () => {
    const reading = factsOf(520, nutrition).read(NutritionBasis.Per100g);

    expect(reading.basis).toBe(NutritionBasis.Per100g);
    expect(reading.calories).toBe(130);
    // 24/4 = 6 → one decimal; 60/4 = 15 → whole; 18/4 = 4.5; 6/4 = 1.5.
    expect(reading.macros.map((m) => m.grams)).toEqual([6, 15, 4.5, 1.5]);
    expect(reading.caloriesPerServing).toBe(520);
  });

  it('keeps one decimal under 10 g and rounds at or above it', () => {
    const reading = factsOf(0, { protein: 3.14159, carbs: 12.6 }).read(NutritionBasis.PerServing);

    expect(reading.macros.map((m) => m.grams)).toEqual([3.1, 13]);
  });

  it('falls back to per serving when the serving weight is missing', () => {
    const facts = factsOf(520, { protein: 24 });
    const reading = facts.read(NutritionBasis.Per100g);

    expect(facts.servingWeightGrams).toBeUndefined();
    expect(reading.basis).toBe(NutritionBasis.PerServing);
    expect(reading.calories).toBe(520);
    expect(reading.macros[0]?.grams).toBe(24);
  });

  it('derives the daily-value percent from the displayed grams, clamped at 100', () => {
    const reading = factsOf(900, { protein: 25, fat: 140 }).read(NutritionBasis.PerServing);

    expect(reading.macros).toEqual([
      { macro: NutritionMacro.Protein, grams: 25, dailyValuePercent: 50 },
      { macro: NutritionMacro.Fat, grams: 140, dailyValuePercent: 100 },
    ]);
  });

  it('leaves out macros that are missing or non-positive', () => {
    const reading = factsOf(300, { protein: 0, carbs: -1, fiber: 4 }).read(NutritionBasis.PerServing);

    expect(reading.macros.map((m) => m.macro)).toEqual([NutritionMacro.Fiber]);
  });

  it('reports no calories when none were measured', () => {
    const facts = factsOf(0, undefined);

    expect(facts.hasAny).toBe(false);
    expect(facts.read(NutritionBasis.PerServing).calories).toBeUndefined();
  });

  it('says a recipe with only calories has something to show', () => {
    expect(factsOf(350, { protein: 0 }).hasAny).toBe(true);
  });
});
