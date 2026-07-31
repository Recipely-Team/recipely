import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { MediaType } from '@domain/recipes/media/media-type';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Projects the editor onto the wire snapshot that gets autosaved.
 *
 * Blank lines are dropped rather than persisted: the editor keeps an empty row
 * at the end so there is always somewhere to type, and saving those would make
 * every resumed draft grow a tail of empty ingredients.
 */
export const editableToSnapshot = (recipe: EditableRecipe): DraftRecipeSnapshot => ({
  name: recipe.name,
  cuisine: recipe.cuisine ?? CharConstants.empty,
  difficulty: recipe.difficulty,
  prepTimeMinutes: recipe.prepTimeMinutes,
  cookTimeMinutes: recipe.cookTimeMinutes,
  servings: recipe.servings,
  ingredients: recipe.ingredients.map((s) => s.trim()).filter((s) => s.length > ValueConstants.zero),
  instructions: recipe.instructions.map((s) => s.trim()).filter((s) => s.length > ValueConstants.zero),
  media: recipe.media
    .filter((m) => m.type === MediaType.Image)
    .map((m) => ({ type: m.type, url: m.url })),
});
