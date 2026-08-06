import type { MediaItem } from '@domain/recipes/media/media-item';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { Difficulty } from '@domain/recipes/difficulty';
import { MediaType } from '@domain/recipes/media/media-type';
import { isHostedMedia } from '@presentation/app/create-recipe/model/saving/is-hosted-media';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { ValueConstants } from '@core/constants';

const isDifficulty = (value: string | undefined): value is Difficulty =>
  value === Difficulty.Easy || value === Difficulty.Medium || value === Difficulty.Hard;

/**
 * A persisted cuisine key for the editor: kept verbatim when set, because the
 * backend owns the catalogue and the local enum mirrors only a subset — an
 * unknown key must survive a resume. Empty becomes `null` so the tile shows
 * its placeholder rather than an empty selection.
 */
const draftCuisine = (text: string): string | null => {
  const trimmed = text.trim();
  return trimmed.length > ValueConstants.zero ? trimmed : null;
};

/**
 * Rebuilds the editor from a saved draft.
 *
 * The snapshot has no `category` — it only matters at publish time — so a
 * resumed draft takes the default rather than inventing one.
 */
export const snapshotToEditable = (snapshot: DraftRecipeSnapshot): EditableRecipe => {
  const base = emptyEditable();
  // Only media the backend hosts survives a resume. Drafts saved before
  // `editableToSnapshot` stopped writing device URIs still hold `blob:` and
  // `file:` addresses that no longer resolve, so restoring one would put a
  // broken image in the editor and fail at publish time instead of here.
  // Filtering on read is what repairs those rows without a migration.
  const media: MediaItem[] = (snapshot.media ?? [])
    .filter((m) => m.type === MediaType.Image && isHostedMedia({ type: MediaType.Image, url: m.url }))
    .map((m) => ({ type: MediaType.Image, url: m.url }));
  return {
    name: snapshot.name ?? base.name,
    cuisine: snapshot.cuisine !== undefined ? draftCuisine(snapshot.cuisine) : base.cuisine,
    category: base.category,
    difficulty: isDifficulty(snapshot.difficulty) ? snapshot.difficulty : base.difficulty,
    prepTimeMinutes: snapshot.prepTimeMinutes ?? base.prepTimeMinutes,
    cookTimeMinutes: snapshot.cookTimeMinutes ?? base.cookTimeMinutes,
    servings: snapshot.servings ?? base.servings,
    ingredients:
      snapshot.ingredients && snapshot.ingredients.length > ValueConstants.zero
        ? [...snapshot.ingredients]
        : base.ingredients,
    instructions:
      snapshot.instructions && snapshot.instructions.length > ValueConstants.zero
        ? [...snapshot.instructions]
        : base.instructions,
    media,
  };
};
