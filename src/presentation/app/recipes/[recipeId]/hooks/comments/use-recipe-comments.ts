import { useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTranslations } from '@presentation/i18n';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import type { UseGuestGateResult } from '@presentation/base/hooks/auth/use-guest-gate-result';
import { useCommentRemoval } from '@presentation/app/recipes/[recipeId]/hooks/comments/use-comment-removal';
import { ValueConstants } from '@core/constants';

/** Whose recipe page, and the sign-in gate commenting goes through. */
interface RecipeCommentsArgs {
  recipeId: string;
  userId: string | null;
  requestGate: UseGuestGateResult['requestGate'];
}

/**
 * The recipe page's comment actions: post, like, delete (asked first) and load more.
 *
 * @remarks
 * - **The posted text always comes from the caller** — the composer (which
 *   owns its draft, so typing does not re-render the page) or the assistant.
 *   Writing the field and posting in the same tick used to read the PREVIOUS
 *   render's value — normally empty, which this drops — while still
 *   reporting success.
 * - **A failed post keeps its message on screen** (`submitError`), resolved
 *   from the failure the store recorded; other failures are toasts.
 * - **Posting and liking are signed-in acts**: a guest gets the sign-in prompt.
 */
export const useRecipeComments = ({ recipeId, userId, requestGate }: RecipeCommentsArgs) => {
  const t = useTranslations();
  const { commentsStore } = useStores();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const removal = useCommentRemoval(async (commentId: string): Promise<void> => {
    const wasRemoved = await commentsStore.getState().deleteComment(recipeId, commentId);
    const failure = commentsStore.getState().byRecipe[recipeId]?.error;
    if (!wasRemoved && failure != null) showErrorToast(failure);
  });

  /** Posts `text`; resolves true once the post lands. */
  const post = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (trimmed.length === ValueConstants.zero) return false;
    const isOk = await commentsStore.getState().addComment(recipeId, trimmed);
    const failure = commentsStore.getState().byRecipe[recipeId]?.error;
    setSubmitError(isOk ? null : failure != null ? failureToastMessage(t, failure) : t.comments.error);
    return isOk;
  };

  const toggleLike = async (commentId: string): Promise<void> => {
    if (userId === null) return;
    const result = await commentsStore.getState().toggleLike(recipeId, commentId);
    if (!result.ok) showErrorToast(result.failure);
  };

  return {
    submitError,
    removal,
    onAddComment: (text: string, onPosted: () => void) =>
      requestGate(() => void post(text).then((isOk) => isOk && onPosted()), t.comments.signInToComment),
    onPostComment: (text: string) => requestGate(() => void post(text), t.comments.signInToComment),
    onLoadMoreComments: () => void commentsStore.getState().loadMore(recipeId),
    onToggleCommentLike: (id: string) => requestGate(() => void toggleLike(id), t.comments.signInToLikeComment),
  };
};
