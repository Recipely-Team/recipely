import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentView } from '@domain/comments/comment-view';
import { StoreStatus } from '@application/store/store-status';
import { RequestEpoch } from '@application/store/request-epoch';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { PagedList } from '@application/store/paging/paged-list';
import { loadedItems } from '@application/store/paging/loaded-items';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { mergeRecipeComments } from '@application/comments/list/merge-recipe-comments';
import { commentsThreadView } from '@application/comments/list/comments-thread-view';
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

const IDLE: PagedList<CommentView> = { status: StoreStatus.Idle };
const commentKey = (view: CommentView): string => view.comment.id;

/**
 * **Comments store** — recipe comment threads keyed by recipe id, so many threads
 * coexist without interference.
 *
 * @remarks
 * - **One `PagedListLoader` per thread** pages it: the newest first page wins, a
 *   next page after a delete re-reads the shifted offset, and the overlap an add
 *   or delete leaves is de-duplicated by comment id. `byRecipe` is its projection.
 * - **Likes are optimistic:** `toggleLike` flips in place, rolls back on failure and
 *   returns the `Result` so the caller can toast the rejection.
 * - **`clear()` on sign-out** resets every loader, dropping answers in flight;
 *   a comment posted under the old session writes nothing back.
 * - **A comment posted before its thread has loaded** (loading, or in error)
 *   reloads the thread, so it is not lost from view until the next visit.
 * - **No try/catch:** the use cases return `Result` and the HTTP client never throws.
 */
export const configureCommentsStore = (deps: CommentsStoreDeps): BoundStore<CommentsStoreState> => {
  const { listComments, addComment, deleteComment, setCommentLike } = deps;
  const lists = new Map<string, PagedList<CommentView>>();
  const loaders = new Map<string, PagedListLoader<CommentView>>();
  const sessions = new RequestEpoch();
  let isSessionCurrent = sessions.start();

  return create<CommentsStoreState>((set, get) => {
    const patch = (recipeId: string, change: Patch): void =>
      set((state) => ({ byRecipe: mergeRecipeComments(state.byRecipe, recipeId, change) }));

    const loaderFor = (recipeId: string): PagedListLoader<CommentView> => {
      const existing = loaders.get(recipeId);
      if (existing !== undefined) return existing;
      const loader = new PagedListLoader<CommentView>(
        () => lists.get(recipeId) ?? IDLE,
        (list) => {
          lists.set(recipeId, list);
          patch(recipeId, () => commentsThreadView(list));
        },
        commentKey,
      );
      loaders.set(recipeId, loader);
      return loader;
    };

    /** Swaps a comment in place; one deleted meanwhile is not brought back. */
    const replaceComment = (recipeId: string, target: CommentView): void => {
      const items = loadedItems(lists.get(recipeId) ?? IDLE);
      if (items.some((c) => c.comment.id === target.comment.id)) loaderFor(recipeId).upsertItem(target);
    };

    return {
      byRecipe: {},
      load: (recipeId) => loaderFor(recipeId).load((page) => listComments.execute(recipeId, page)),
      loadMore: (recipeId) => loaderFor(recipeId).loadMore(),
      addComment: async (recipeId, body) => {
        patch(recipeId, () => ({ isSubmitting: true, error: null }));
        const isCurrent = isSessionCurrent;
        const result = await addComment.execute({ recipeId, body });
        if (!isCurrent()) return result.ok;
        const isLoaded = (lists.get(recipeId) ?? IDLE).status === StoreStatus.Loaded;
        if (result.ok && isLoaded) loaderFor(recipeId).upsertItem({ comment: result.value, likedByMe: false });
        else if (result.ok) void get().load(recipeId);
        patch(recipeId, () => (result.ok ? { isSubmitting: false, error: null } : { isSubmitting: false, error: result.failure }));
        return result.ok;
      },
      deleteComment: async (recipeId, commentId) => {
        const result = await deleteComment.execute({ recipeId, commentId });
        if (result.ok) loaderFor(recipeId).removeItem(commentId);
        patch(recipeId, () => ({ error: result.ok ? null : result.failure }));
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
        isSessionCurrent = sessions.start();
        loaders.forEach((loader) => loader.reset());
        loaders.clear();
        lists.clear();
        set({ byRecipe: {} });
      },
    };
  });
};
