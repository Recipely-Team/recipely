import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { EditableDefaults } from '@presentation/app/create-recipe/model/drafting/editable-defaults';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Seeds the editor from a recipe the AI generated or the app loaded.
 *
 * Zeroes fall back to the defaults rather than through: a recipe claiming to
 * take no time and serve nobody is missing data, not a statement. `prevMedia`
 * survives an incoming recipe with no images so a photo the user already
 * picked is not thrown away by a regenerate.
 */
export const recipeToEditable = (
  recipe: RecipeEntity,
  prevMedia: readonly MediaItem[],
): EditableRecipe => ({
  name: recipe.name,
  cuisine: recipe.cuisine,
  category: recipe.category,
  difficulty: recipe.difficulty,
  prepTimeMinutes:
    recipe.prepTimeMinutes > ValueConstants.zero ? recipe.prepTimeMinutes : EditableDefaults.prepTimeMinutes,
  cookTimeMinutes:
    recipe.cookTimeMinutes > ValueConstants.zero ? recipe.cookTimeMinutes : EditableDefaults.cookTimeMinutes,
  servings: recipe.servings > ValueConstants.zero ? recipe.servings : EditableDefaults.servings,
  ingredients:
    recipe.ingredients.length > ValueConstants.zero ? [...recipe.ingredients] : [CharConstants.empty],
  instructions:
    recipe.instructions.length > ValueConstants.zero ? [...recipe.instructions] : [CharConstants.empty],
  media: recipe.media.length > ValueConstants.zero ? [...recipe.media] : [...prevMedia],
});
