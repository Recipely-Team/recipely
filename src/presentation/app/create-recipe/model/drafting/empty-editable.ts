import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { EditableDefaults } from '@presentation/app/create-recipe/model/drafting/editable-defaults';
import { CharConstants } from '@core/constants';

/** A pristine editable model, for "start from a blank recipe". */
export const emptyEditable = (): EditableRecipe => ({
  name: CharConstants.empty,
  cuisine: null,
  category: RecipeCategory.MainCourse,
  difficulty: Difficulty.Easy,
  prepTimeMinutes: EditableDefaults.prepTimeMinutes,
  cookTimeMinutes: EditableDefaults.cookTimeMinutes,
  servings: EditableDefaults.servings,
  ingredients: [CharConstants.empty],
  instructions: [CharConstants.empty],
  media: [],
});
