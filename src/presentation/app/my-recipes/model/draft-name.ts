import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { CharConstants } from '@core/constants';

/**
 * What to call a draft out loud.
 *
 * A draft has no title of its own — it holds a snapshot of a recipe that may
 * still be unnamed — so the prompt it was created from is the fallback. That
 * is also what the user would call it: "the one I asked for with chicken".
 */
export const draftName = (draft: RecipeDraft): string => {
  const name = draft.snapshot.name;
  return name !== undefined && name !== CharConstants.empty ? name : draft.prompt;
};
