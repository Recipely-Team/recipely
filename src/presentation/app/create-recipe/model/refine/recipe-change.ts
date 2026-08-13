import type { RecipeChangeKind } from '@presentation/app/create-recipe/model/refine/recipe-change-kind';
import type { CreateRecipeFieldKey } from '@presentation/app/create-recipe/model/validation/create-recipe-field-key';

/**
 * One field the assistant proposes to change, as the proposal card shows it.
 *
 * @remarks
 * - **Values stay raw** — `before` / `after` carry the recipe's own strings, so
 *   a cuisine arrives as its taxonomy key. Turning that into a name needs the
 *   catalog, which is a hook the card already holds and this model must not
 *   reach for; keeping the diff pure is what makes it testable without one.
 * - **Lists are line-wise, not positional.** A step inserted at the top would
 *   otherwise report every following step as changed, which is true of the
 *   indices and useless to a cook.
 */
export type RecipeChange =
  | {
      readonly field: CreateRecipeFieldKey;
      readonly kind: typeof RecipeChangeKind.Value;
      readonly before: string;
      readonly after: string;
    }
  | {
      readonly field: CreateRecipeFieldKey;
      readonly kind: typeof RecipeChangeKind.List;
      readonly added: readonly string[];
      readonly removed: readonly string[];
    };
