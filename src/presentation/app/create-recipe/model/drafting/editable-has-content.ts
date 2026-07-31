import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { ValueConstants } from '@core/constants';

/**
 * True when the editor holds something worth saving as a draft.
 *
 * Only the fields a user types count. A blank recipe still carries a category,
 * a difficulty and default times, so testing "is it different from empty"
 * would autosave a draft for anyone who merely opened the screen.
 */
export const editableHasContent = (recipe: EditableRecipe): boolean =>
  recipe.name.trim().length > ValueConstants.zero ||
  recipe.ingredients.some((s) => s.trim().length > ValueConstants.zero) ||
  recipe.instructions.some((s) => s.trim().length > ValueConstants.zero);
