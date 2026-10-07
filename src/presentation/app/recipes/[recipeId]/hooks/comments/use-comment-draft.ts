import { useCallback, useState } from 'react';
import { CharConstants } from '@core/constants';
import { isBlank } from '@core/guards/type-guards';
import type { UseCommentDraftResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-draft-result';

/**
 * The comment composer's own text: typed here, handed up only when sent, and
 * cleared once the post lands.
 *
 * @remarks
 * **Owned by the composer, not the screen.** The draft used to live in
 * `useRecipeDetail`, so every keystroke re-rendered the whole detail tree —
 * header, photos, ingredients, steps. Kept here, a keystroke re-renders the
 * comments block only. A failed post keeps the text, so nothing typed is lost.
 */
export const useCommentDraft = (
  onAddComment: (text: string, onPosted: () => void) => void,
): UseCommentDraftResult => {
  const [draft, setDraft] = useState(CharConstants.empty);
  const onSubmit = useCallback(
    () => onAddComment(draft, () => setDraft(CharConstants.empty)),
    [onAddComment, draft],
  );
  return { draft, onChangeDraft: setDraft, isEmpty: isBlank(draft), onSubmit };
};
