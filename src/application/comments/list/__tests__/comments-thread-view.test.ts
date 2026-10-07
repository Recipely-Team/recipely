import { NetworkFailure } from '@core/failure';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { CommentView } from '@domain/comments/comment-view';
import { StoreStatus } from '@application/store/store-status';
import { commentsThreadView } from '@application/comments/list/comments-thread-view';

const comment = (id: string): CommentView => ({ id }) as unknown as CommentView;

describe('commentsThreadView', () => {
  it('shows a spinner and nothing else while the first page loads', () => {
    expect(commentsThreadView({ status: StoreStatus.Loading })).toEqual({
      items: [],
      total: 0,
      page: FIRST_PAGE,
      isLoading: true,
      isLoadingMore: false,
      error: null,
    });
  });

  it('is neither loading nor failed before anything was asked for', () => {
    expect(commentsThreadView({ status: StoreStatus.Idle })).toMatchObject({ isLoading: false, error: null, items: [] });
  });

  it('carries the failure of a first page that could not load', () => {
    const failure = new NetworkFailure('offline');

    expect(commentsThreadView({ status: StoreStatus.Error, failure })).toMatchObject({ isLoading: false, error: failure, items: [] });
  });

  it('surfaces a failed next page as the error while keeping the comments already shown', () => {
    const moreFailure = new NetworkFailure('offline');
    const items = [comment('c1'), comment('c2')];

    const view = commentsThreadView({
      status: StoreStatus.Loaded,
      items,
      page: 2,
      total: 9,
      hasMore: true,
      isLoadingMore: true,
      moreFailure,
    });

    expect(view).toEqual({ items, total: 9, page: 2, isLoading: false, isLoadingMore: true, error: moreFailure });
    expect(view.items).not.toBe(items);
  });
});
