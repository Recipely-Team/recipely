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

/** A persisted category, or nothing when the draft never carried one. */
const draftCategory = (text: string | undefined): string | undefined => {
  const trimmed = text?.trim();
  return trimmed !== undefined && trimmed.length > ValueConstants.zero ? trimmed : undefined;
};

/**
 * Rebuilds the editor from a saved draft.
 *
 * @remarks
 * - **`category` is read back, verbatim.** It was deliberately ignored here —
 *   "it only matters at publish time" — but publish reads it from the EDITOR,
 *   so ignoring it meant every resumed draft published as `MAIN_COURSE`. A
 *   sütlaç saved as a dessert came back a main course, and the value was sitting
 *   in the row the whole time: `editableToSnapshot` has always carried it
 *   through. Kept verbatim for the reason `cuisine` is — the backend's catalogue
 *   has 32 categories and this app's enum mirrors 11, so validating against the
 *   local list would throw away a legitimate key. That is safe because every
 *   value that can land here is one the backend's catalogue recognises: a
 *   generated recipe's own category, this editor's default, or a pick from the
 *   taxonomy sheet, which offers the local subset. There is no writer that can
 *   invent one.
 * - **`image` is a cover the editor never saw.** An Instagram import stores its
 *   chosen frame there and leaves `media` empty, and this mapper only ever read
 *   `media` — so an imported draft opened in the editor said "no photo yet"
 *   about a cover that existed and was being served. Seeding media from it is
 *   what puts the imported frame in front of the user, and it is a fallback
 *   rather than an override: once the editor has hosted media of its own, that
 *   is the newer answer.
 */
export const snapshotToEditable = (snapshot: DraftRecipeSnapshot): EditableRecipe => {
  const base = emptyEditable();
  // Only media the backend hosts survives a resume. Drafts saved before
  // `editableToSnapshot` stopped writing device URIs still hold `blob:` and
  // `file:` addresses that no longer resolve, so restoring one would put a
  // broken image in the editor and fail at publish time instead of here.
  // Filtering on read is what repairs those rows without a migration.
  const hosted: MediaItem[] = (snapshot.media ?? [])
    .filter((m) => m.type === MediaType.Image && isHostedMedia({ type: MediaType.Image, url: m.url }))
    .map((m) => ({ type: MediaType.Image, url: m.url }));
  const cover = snapshot.image;
  const media: MediaItem[] =
    hosted.length > ValueConstants.zero ||
    cover === undefined ||
    !isHostedMedia({ type: MediaType.Image, url: cover })
      ? hosted
      : [{ type: MediaType.Image, url: cover }];
  return {
    name: snapshot.name ?? base.name,
    cuisine: snapshot.cuisine !== undefined ? draftCuisine(snapshot.cuisine) : base.cuisine,
    category: draftCategory(snapshot.category) ?? base.category,
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
