import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import { ValueConstants } from '@core/constants';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { CommentView } from '@domain/comments/comment-view';
import { KeyedRequestEpoch } from '@application/store/keyed-request-epoch';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { defaultRecipeCommentsState } from '@application/comments/list/default-recipe-comments-state';
import { mergeRecipeComments } from '@application/comments/list/merge-recipe-comments';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { SetCommentLikeUseCase } from '@application/comments/like/set-comment-like-use-case';

interface CommentsStoreDeps {
  listComments: ListCommentsUseCase;
  addComment: AddCommentUseCase;
  deleteComment: DeleteCommentUseCase;
  setCommentLike: SetCommentLikeUseCase;
}

type Patch = (current: RecipeCommentsState) => Partial<RecipeCommentsState>;

/**
 * **Comments store** — recipe comment threads keyed by recipe id, so many threads
 * coexist without interference.
 *
 * @remarks
 * - **Newest page request per recipe wins** (`KeyedRequestEpoch`): a reload drops an
 *   older load / loadMore answer, and `clear()` on sign-out drops every one in flight.
 * - **Likes are optimistic:** `toggleLike` flips in place, rolls back on failure and
 *   returns the `Result` so the caller can toast the rejection.
 * - **No try/catch:** the use cases return `Result` and the HTTP client never throws.
 */
export const configureCommentsStore = (deps: CommentsStoreDeps): BoundStore<CommentsStoreState> => {
  const { listComments, addComment, deleteComment, setCommentLike } = deps;
  const pageRequests = new KeyedRequestEpoch();

  return create<CommentsStoreState>((set, get) => {
    const patch = (recipeId: string, change: Patch): void =>
      set((state) => ({ byRecipe: mergeRecipeComments(state.byRecipe, recipeId, change) }));

    const fetchPage = async (recipeId: string, page: number): Promise<void> => {
      const isCurrent = pageRequests.start(recipeId);
      const result = await listComments.execute(recipeId, page);
      if (!isCurrent()) return;
      const settled = { isLoading: false, isLoadingMore: false };
      patch(recipeId, (current) => (result.ok
        ? {
          ...settled,
          items: page === FIRST_PAGE ? [...result.value.items] : [...current.items, ...result.value.items],
          total: result.value.total,
          page,
          error: null,
        }
        : { ...settled, error: result.failure }));
    };

    const replaceComment = (recipeId: string, target: CommentView): void => {
      if (get().byRecipe[recipeId] === undefined) return;
      patch(recipeId, (current) => ({
        items: current.items.map((c) => (c.comment.id === target.comment.id ? target : c)),
      }));
    };

    return {
      byRecipe: {},
      load: async (recipeId) => {
        patch(recipeId, () => ({ isLoading: true, error: null }));
        await fetchPage(recipeId, FIRST_PAGE);
      },
      loadMore: async (recipeId) => {
        const current = get().byRecipe[recipeId] ?? defaultRecipeCommentsState();
        if (current.isLoading || current.isLoadingMore || current.items.length >= current.total) return;
        patch(recipeId, () => ({ isLoadingMore: true, error: null }));
        await fetchPage(recipeId, current.page + ValueConstants.one);
      },
      addComment: async (recipeId, body) => {
        patch(recipeId, () => ({ isSubmitting: true, error: null }));
        const result = await addComment.execute({ recipeId, body });
        patch(recipeId, (current) => (result.ok
          ? {
            items: [{ comment: result.value, likedByMe: false }, ...current.items],
            total: current.total + ValueConstants.one,
            isSubmitting: false,
            error: null,
          }
          : { isSubmitting: false, error: result.failure }));
        return result.ok;
      },
      deleteComment: async (recipeId, commentId) => {
        const result = await deleteComment.execute({ recipeId, commentId });
        patch(recipeId, (current) => (result.ok
          ? {
            items: current.items.filter((c) => c.comment.id !== commentId),
            total: Math.max(ValueConstants.zero, current.total - ValueConstants.one),
            error: null,
          }
          : { error: result.failure }));
        return result.ok;
      },
      toggleLike: async (recipeId, commentId): Promise<Result<void, Failure>> => {
        const original = get().byRecipe[recipeId]?.items.find((c) => c.comment.id === commentId);
        if (original === undefined) return ok(undefined);
        const like = !original.likedByMe;
        replaceComment(recipeId, { comment: original.comment.withViewerLike(like), likedByMe: like });
        const result = await setCommentLike.execute(recipeId, commentId, like);
        if (!result.ok) replaceComment(recipeId, original);
        return result;
      },
      clear: () => {
        pageRequests.invalidate();
        set({ byRecipe: {} });
      },
    };
  });
};
