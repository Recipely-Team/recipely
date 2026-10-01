import { toNutritionSource } from '@domain/recipes/nutrition/to-nutrition-source';
import { NutritionSource } from '@domain/recipes/nutrition/nutrition-source';

describe('toNutritionSource', () => {
  it('names USDA FoodData Central', () => {
    expect(toNutritionSource('USDA_FDC')).toBe(NutritionSource.Usda);
  });

  it.each([null, undefined, '', 'usda_fdc', 'CIQUAL'])('names no source for %p', (raw) => {
    expect(toNutritionSource(raw)).toBeNull();
  });
});
