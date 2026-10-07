import { ValueConstants } from '@core/constants';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { CommentView } from '@domain/comments/comment-view';
import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/store/paging/paged-list';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';

/**
 * The screen-facing fields of a comment thread, read off the `PagedList` its
 * loader drives; `isSubmitting` is the store's own and is not touched here.
 */
export const commentsThreadView = (
  list: PagedList<CommentView>,
): Omit<RecipeCommentsState, 'isSubmitting'> => {
  if (list.status !== StoreStatus.Loaded) {
    return {
      items: [],
      total: ValueConstants.zero,
      page: FIRST_PAGE,
      isLoading: list.status === StoreStatus.Loading,
      isLoadingMore: false,
      error: list.status === StoreStatus.Error ? list.failure : null,
    };
  }
  return {
    items: [...list.items],
    total: list.total,
    page: list.page,
    isLoading: false,
    isLoadingMore: list.isLoadingMore,
    error: list.moreFailure,
  };
};
