import { toEditRecipeRequest } from '@infrastructure/recipes/edit/to-edit-recipe-request';

describe('toEditRecipeRequest — nutrition', () => {
  it('sends the serving weight back with the macros, so an edit does not drop it', () => {
    const nutrition = { protein: 12, carbs: 30, servingWeightGrams: 250 };

    expect(toEditRecipeRequest({ servings: 2, nutrition }).nutrition).toEqual(nutrition);
  });
});
