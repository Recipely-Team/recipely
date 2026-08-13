import { CharConstants, ValueConstants } from '@core/constants';
import { RecipeChangeKind } from '@presentation/app/create-recipe/model/refine/recipe-change-kind';

import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { RecipeChange } from '@presentation/app/create-recipe/model/refine/recipe-change';

/** The scalar fields, in the order the proposal card lists them. */
const VALUE_FIELDS = [
  'name',
  'cuisine',
  'category',
  'difficulty',
  'servings',
  'prepTimeMinutes',
  'cookTimeMinutes',
] as const;

/** The line-wise fields, listed after the scalars because they are the long ones. */
const LIST_FIELDS = ['ingredients', 'instructions'] as const;

/**
 * Describes what a refinement would alter, so the cook can decide before
 * anything is applied.
 *
 * @remarks
 * - **`media` is never compared.** A refinement carries the photos already on
 *   the working recipe forward untouched, so any difference here would be an
 *   artefact of the mapping rather than something the assistant proposed.
 * - **A null cuisine is an empty string, not "null".** It is the one nullable
 *   field, and rendering the word would put it in front of the user.
 * - **An unchanged field yields nothing.** The card's whole job is to be short
 *   enough to read, and the recipe arrives back whole on every turn — listing
 *   every field would describe the recipe, not the change.
 */
export const diffEditableRecipes = (
  before: EditableRecipe,
  after: EditableRecipe,
): readonly RecipeChange[] => {
  const changes: RecipeChange[] = [];

  for (const field of VALUE_FIELDS) {
    const from = String(before[field] ?? CharConstants.empty);
    const to = String(after[field] ?? CharConstants.empty);
    if (from === to) continue;
    changes.push({ field, kind: RecipeChangeKind.Value, before: from, after: to });
  }

  for (const field of LIST_FIELDS) {
    const from = before[field];
    const to = after[field];
    const added = to.filter((line) => !from.includes(line));
    const removed = from.filter((line) => !to.includes(line));
    if (added.length === ValueConstants.zero && removed.length === ValueConstants.zero) continue;
    changes.push({ field, kind: RecipeChangeKind.List, added, removed });
  }

  return changes;
};
