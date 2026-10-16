import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import type { ImportReading } from '@domain/drafts/import-reading';

/**
 * A partial, transient snapshot of the recipe a user is shaping inside the
 * AI create flow. Every field is optional because a draft can be saved at any
 * stage of completion. The wire shape mirrors the backend
 * `DraftRecipeSnapshot` exactly.
 *
 * @remarks
 * **The second group is written by an import, not by the editor.** An Instagram
 * import extracts a full recipe and stores its cover in `image`; the create
 * screen has no field for any of it. This type used to stop at `media`, so the
 * app's own projection of a draft could not even NAME them — and a save built
 * from that projection deleted them. Declaring them is what makes carrying them
 * through possible; see `editableToSnapshot`.
 */
export interface DraftRecipeSnapshot {
  name?: string;
  cuisine?: string;
  difficulty?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  ingredients?: string[];
  instructions?: string[];
  media?: { type: string; url: string }[];

  /** Cover URL the backend already hosts — never raw bytes, never a device URI. */
  image?: string;
  category?: string;
  tags?: string[];
  mealType?: string[];
  tips?: string[];
  caloriesPerServing?: number;
  nutrition?: RecipeNutrition;

  /** Server-owned, set by an import: what it read and how sure it was. Never sent back. */
  importReading?: ImportReading;
  /** Server-owned: the post an import was read from, and where it came from. */
  sourceUrl?: string;
  sourcePlatform?: string;
  /** Client-owned: the guessed lines (by text) not edited yet, so the chips survive a resume. */
  guessedLines?: string[];
}
