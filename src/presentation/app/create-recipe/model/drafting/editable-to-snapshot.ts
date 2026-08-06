import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { MediaType } from '@domain/recipes/media/media-type';
import { isHostedMedia } from '@presentation/app/create-recipe/model/saving/is-hosted-media';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Projects the editor onto the wire snapshot that gets autosaved.
 *
 * @remarks
 * - **Blank lines are dropped rather than persisted.** The editor keeps an
 *   empty row at the end so there is always somewhere to type, and saving those
 *   would make every resumed draft grow a tail of empty ingredients.
 * - **Only media the BACKEND hosts is persisted.** A photo the user just picked
 *   is a `blob:` on web and a `file:`/`content:`/`ph:` URI on device — both
 *   scoped to a session or a cache the OS may clear, so writing one into a
 *   draft records an address that will not resolve when the draft is resumed.
 *   It did not merely lose the photo: publishing a resumed draft then tried to
 *   upload it, and on web `fetch()` of a revoked blob threw, leaving the button
 *   on "Yayınlanıyor…" forever, while on device the cover simply never arrived
 *   and the backend rejected the recipe for a missing image.
 *
 *   Nothing is lost that was not already lost — the editor keeps its own media
 *   in memory, so publishing in the same session is unaffected. Dropping it
 *   here makes a resumed draft honest about having no photo, at the point where
 *   the user can just pick another one.
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
    .filter((m) => m.type === MediaType.Image && isHostedMedia(m))
    .map((m) => ({ type: m.type, url: m.url })),
});
