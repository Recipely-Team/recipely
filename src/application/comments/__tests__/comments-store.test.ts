import { configureCommentsStore } from '@application/comments/comments-store';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { SetCommentLikeUseCase } from '@application/comments/like/set-comment-like-use-case';
import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CommentEntity } from '@domain/comments/comment-entity';
import type { CommentEntityProps } from '@domain/comments/comment-entity-props';
import type { Page } from '@domain/common/page';
import type { CommentView } from '@domain/comments/comment-view';

const RECIPE_ID = 'recipe-3';

const makeComment = (
  { likedByMe = false, ...overrides }: Partial<CommentEntityProps> & { likedByMe?: boolean } = {},
): CommentView => {
  const result = CommentEntity.create({
    id: 'c1',
    body: 'Looks delicious!',
    authorId: 'author-9',
    recipeId: RECIPE_ID,
    createdAt: new Date('2026-05-11T12:00:00.000Z'),
    authorDisplayName: 'Ada Lovelace',
    authorPhotoUrl: null,
    likeCount: 5,
    ...overrides,
  });
  if (!result.ok) throw new Error('Test setup expected a valid Comment');
  return { comment: result.value, likedByMe };
};

interface LikeCall {
  recipeId: string;
  commentId: string;
  like: boolean;
}

interface StubConfig {
  seed: CommentView[];
  likeResult?: Result<void, Failure>;
  list?: (recipeId: string, page: number) => Promise<Result<Page<CommentView>, Failure>>;
  add?: Result<CommentEntity, Failure>;
  remove?: Result<void, Failure>;
}

const pageOf = (items: CommentView[], total = items.length, page = 1, pageSize = 20): Page<CommentView> => ({
  items,
  total,
  page,
  pageSize,
  hasMore: page * pageSize < total,
});

const makeStore = (config: StubConfig) => {
  const likeCalls: LikeCall[] = [];
  const notConfigured = fail(new NetworkFailure('not configured'));

  const listComments = {
    execute: config.list ?? (() => Promise.resolve(ok(pageOf(config.seed)))),
  } as unknown as ListCommentsUseCase;
  const addComment = {
    execute: () => Promise.resolve(config.add ?? notConfigured),
  } as unknown as AddCommentUseCase;
  const deleteComment = {
    execute: () => Promise.resolve(config.remove ?? notConfigured),
  } as unknown as DeleteCommentUseCase;
  const setCommentLike = {
    execute: (recipeId: string, commentId: string, like: boolean) => {
      likeCalls.push({ recipeId, commentId, like });
      return Promise.resolve(config.likeResult ?? ok(undefined));
    },
  } as unknown as SetCommentLikeUseCase;

  const store = configureCommentsStore({ listComments, addComment, deleteComment, setCommentLike });

  return { store, likeCalls };
};

/** A list answer the test releases by hand, to order it against other calls. */
const deferredPage = () => {
  let release: (page: Page<CommentView>) => void = () => undefined;
  const promise = new Promise<Result<Page<CommentView>, Failure>>((resolve) => {
    release = (page) => resolve(ok(page));
  });
  return { promise, release };
};

const seededStore = async (config: StubConfig) => {
  const ctx = makeStore(config);
  await ctx.store.getState().load(RECIPE_ID);
  return ctx;
};

const itemOf = (store: ReturnType<typeof makeStore>['store'], commentId: string) =>
  store.getState().byRecipe[RECIPE_ID].items.find((c) => c.comment.id === commentId);

describe('commentsStore.toggleLike — like direction', () => {
  it('optimistically flips an unliked comment to liked before resolving', async () => {
    const { store } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
    });

    const pending = store.getState().toggleLike(RECIPE_ID, 'c1');

    const optimistic = itemOf(store, 'c1');
    expect(optimistic?.likedByMe).toBe(true);
    expect(optimistic?.comment.likeCount).toBe(6);
    await pending;
  });

  it('likes the comment and keeps the liked state on success', async () => {
    const { store, likeCalls } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
      likeResult: ok(undefined),
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'c1');

    expect(result.ok).toBe(true);
    expect(likeCalls).toEqual([{ recipeId: RECIPE_ID, commentId: 'c1', like: true }]);
    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(true);
    expect(item?.comment.likeCount).toBe(6);
  });

  it('rolls back to the original like state and returns the failure when the like fails', async () => {
    const failure = new NetworkFailure('offline');
    const { store } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
      likeResult: fail(failure),
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'c1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(false);
    expect(item?.comment.likeCount).toBe(5);
  });
});

describe('commentsStore.toggleLike — unlike direction', () => {
  it('removes the like and decrements the count on success', async () => {
    const { store, likeCalls } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: true, likeCount: 5 })],
      likeResult: ok(undefined),
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'c1');

    expect(result.ok).toBe(true);
    expect(likeCalls).toEqual([{ recipeId: RECIPE_ID, commentId: 'c1', like: false }]);
    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(false);
    expect(item?.comment.likeCount).toBe(4);
  });

  it('rolls back to liked when removing the like fails', async () => {
    const { store } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: true, likeCount: 5 })],
      likeResult: fail(new NetworkFailure('offline')),
    });

    await store.getState().toggleLike(RECIPE_ID, 'c1');

    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(true);
    expect(item?.comment.likeCount).toBe(5);
  });
});

describe('commentsStore.toggleLike — missing comment', () => {
  it('returns ok and sends nothing when the comment is not in the list', async () => {
    const { store, likeCalls } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'does-not-exist');

    expect(result.ok).toBe(true);
    expect(likeCalls).toHaveLength(0);
  });

  it('returns ok when the recipe has no loaded state at all', async () => {
    const { store, likeCalls } = makeStore({
      seed: [makeComment({ id: 'c1' })],
    });

    const result = await store.getState().toggleLike('never-loaded', 'c1');

    expect(result.ok).toBe(true);
    expect(likeCalls).toHaveLength(0);
  });
});

describe('commentsStore.clear', () => {
  // Regression: cached threads survived sign-out / account deletion, so a
  // deleted account's comments stayed on screen until a manual refresh.
  it('drops every cached recipe thread so the next visit re-fetches', async () => {
    const { store } = await seededStore({ seed: [makeComment({ id: 'c1' })] });
    expect(store.getState().byRecipe[RECIPE_ID]).toBeDefined();

    store.getState().clear();

    expect(store.getState().byRecipe).toEqual({});
  });
});

describe('commentsStore.load / loadMore', () => {
  it('appends the next page and stops once every comment is loaded', async () => {
    const pages: Record<number, CommentView[]> = {
      1: [makeComment({ id: 'c1' })],
      2: [makeComment({ id: 'c2' })],
    };
    const requested: number[] = [];
    const { store } = makeStore({
      seed: [],
      list: (_recipeId, page) => {
        requested.push(page);
        return Promise.resolve(ok(pageOf(pages[page] ?? [], 2, page, 1)));
      },
    });

    await store.getState().load(RECIPE_ID);
    await store.getState().loadMore(RECIPE_ID);
    await store.getState().loadMore(RECIPE_ID);

    const thread = store.getState().byRecipe[RECIPE_ID];
    expect(thread.items.map((c) => c.comment.id)).toEqual(['c1', 'c2']);
    expect(thread.page).toBe(2);
    expect(thread.isLoadingMore).toBe(false);
    expect(requested).toEqual([1, 2]);
  });

  it('keeps the failure and clears the spinner when a page fails', async () => {
    const failure = new NetworkFailure('offline');
    const { store } = makeStore({ seed: [], list: () => Promise.resolve(fail(failure)) });

    await store.getState().load(RECIPE_ID);

    const thread = store.getState().byRecipe[RECIPE_ID];
    expect(thread.error).toBe(failure);
    expect(thread.isLoading).toBe(false);
  });

  // Regression: the loaders had no request guard, so a load answering after
  // sign-out (`clear()`) wrote the old account's thread back into the store.
  it('a load answering after sign-out does not bring the old thread back', async () => {
    const answer = deferredPage();
    const { store } = makeStore({ seed: [], list: () => answer.promise });

    const pending = store.getState().load(RECIPE_ID);
    store.getState().clear();
    answer.release(pageOf([makeComment({ id: 'c1' })]));
    await pending;

    expect(store.getState().byRecipe).toEqual({});
  });

  it('an older load answering after a newer one does not overwrite it', async () => {
    const first = deferredPage();
    const second = deferredPage();
    const answers = [first, second];
    const { store } = makeStore({ seed: [], list: () => (answers.shift() ?? second).promise });

    const older = store.getState().load(RECIPE_ID);
    const newer = store.getState().load(RECIPE_ID);
    second.release(pageOf([makeComment({ id: 'fresh' })]));
    await newer;
    first.release(pageOf([makeComment({ id: 'stale' })]));
    await older;

    const thread = store.getState().byRecipe[RECIPE_ID];
    expect(thread.items.map((c) => c.comment.id)).toEqual(['fresh']);
    expect(thread.isLoading).toBe(false);
  });
});

describe('commentsStore.addComment / deleteComment', () => {
  it('prepends the created comment and counts it', async () => {
    const created = makeComment({ id: 'new' });
    const { store } = await seededStore({ seed: [makeComment({ id: 'c1' })], add: ok(created.comment) });

    const added = await store.getState().addComment(RECIPE_ID, 'Lovely');

    const thread = store.getState().byRecipe[RECIPE_ID];
    expect(added).toBe(true);
    expect(thread.items.map((c) => c.comment.id)).toEqual(['new', 'c1']);
    expect(thread.total).toBe(2);
    expect(thread.isSubmitting).toBe(false);
  });

  it('keeps the failure for the screen when posting fails', async () => {
    const failure = new NetworkFailure('offline');
    const { store } = await seededStore({ seed: [], add: fail(failure) });

    const added = await store.getState().addComment(RECIPE_ID, 'Lovely');

    expect(added).toBe(false);
    expect(store.getState().byRecipe[RECIPE_ID].error).toBe(failure);
  });

  it('removes a deleted comment and lowers the total', async () => {
    const { store } = await seededStore({
      seed: [makeComment({ id: 'c1' }), makeComment({ id: 'c2' })],
      remove: ok(undefined),
    });

    const deleted = await store.getState().deleteComment(RECIPE_ID, 'c1');

    const thread = store.getState().byRecipe[RECIPE_ID];
    expect(deleted).toBe(true);
    expect(thread.items.map((c) => c.comment.id)).toEqual(['c2']);
    expect(thread.total).toBe(1);
  });
});

/**
 * A fake backend thread paged two at a time, newest first, that takes adds and
 * deletes, so a page fetched after either sees the shifted offsets.
 */
const PAGE_SIZE = 2;
const serverThread = (ids: string[]) => {
  const rows = ids.map((id) => makeComment({ id }));
  const list = (_recipeId: string, page: number): Promise<Result<Page<CommentView>, Failure>> => {
    const start = (page - 1) * PAGE_SIZE;
    return Promise.resolve(ok({
      items: rows.slice(start, start + PAGE_SIZE),
      total: rows.length,
      page,
      pageSize: PAGE_SIZE,
      hasMore: start + PAGE_SIZE < rows.length,
    }));
  };
  return { rows, list };
};

describe('commentsStore — a write before the next page', () => {
  // Regression: loadMore asked for `page + 1` and appended without de-dup, so
  // after posting a comment the row it pushed onto page 2 was shown twice.
  it('a comment posted before "load more" does not show an older comment twice', async () => {
    const server = serverThread(['c1', 'c2', 'c3', 'c4']);
    const created = makeComment({ id: 'new' });
    const { store } = makeStore({ seed: [], list: server.list, add: ok(created.comment) });
    await store.getState().load(RECIPE_ID);

    await store.getState().addComment(RECIPE_ID, 'Lovely');
    server.rows.unshift(created);
    await store.getState().loadMore(RECIPE_ID);

    expect(store.getState().byRecipe[RECIPE_ID].items.map((c) => c.comment.id)).toEqual(['new', 'c1', 'c2', 'c3']);
  });

  // Regression: after a delete every later row moved up one on the server,
  // so `page + 1` started one row too late and that comment was never shown.
  it('a comment deleted before "load more" does not hide the next comment', async () => {
    const server = serverThread(['c1', 'c2', 'c3', 'c4']);
    const { store } = makeStore({ seed: [], list: server.list, remove: ok(undefined) });
    await store.getState().load(RECIPE_ID);

    await store.getState().deleteComment(RECIPE_ID, 'c1');
    server.rows.shift();
    await store.getState().loadMore(RECIPE_ID);
    await store.getState().loadMore(RECIPE_ID);

    expect(store.getState().byRecipe[RECIPE_ID].items.map((c) => c.comment.id)).toEqual(['c2', 'c3', 'c4']);
  });
});
