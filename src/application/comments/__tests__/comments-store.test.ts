import { configureCommentsStore } from '@application/comments/configure-comments-store';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CommentEntity, type CommentProps } from '@domain/comments/comment-entity';
import type { CommentPage } from '@domain/comments/comment-page';

const RECIPE_ID = 'recipe-3';

const makeComment = (overrides: Partial<CommentProps> = {}): CommentEntity => {
  const result = CommentEntity.create({
    id: 'c1',
    body: 'Looks delicious!',
    authorId: 'author-9',
    recipeId: RECIPE_ID,
    createdAt: new Date('2026-05-11T12:00:00.000Z'),
    authorDisplayName: 'Ada Lovelace',
    authorPhotoUrl: null,
    likeCount: 5,
    likedByMe: false,
    ...overrides,
  });
  if (!result.ok) throw new Error('Test setup expected a valid Comment');
  return result.value;
};

interface LikeCall {
  recipeId: string;
  commentId: string;
}

interface StubConfig {
  seed: CommentEntity[];
  likeResult?: Result<void, Failure>;
  unlikeResult?: Result<void, Failure>;
}

const makeStore = (config: StubConfig) => {
  const likeCalls: LikeCall[] = [];
  const unlikeCalls: LikeCall[] = [];

  const page: CommentPage = {
    items: config.seed,
    total: config.seed.length,
    page: 1,
    pageSize: 20,
  };

  const listComments = {
    execute: () => Promise.resolve(ok(page)),
  } as unknown as ListCommentsUseCase;
  const addComment = {
    execute: () => Promise.resolve(fail(new NetworkFailure('not configured'))),
  } as unknown as AddCommentUseCase;
  const deleteComment = {
    execute: () => Promise.resolve(fail(new NetworkFailure('not configured'))),
  } as unknown as DeleteCommentUseCase;
  const likeComment = {
    execute: (recipeId: string, commentId: string) => {
      likeCalls.push({ recipeId, commentId });
      return Promise.resolve(config.likeResult ?? ok(undefined));
    },
  } as unknown as LikeCommentUseCase;
  const unlikeComment = {
    execute: (recipeId: string, commentId: string) => {
      unlikeCalls.push({ recipeId, commentId });
      return Promise.resolve(config.unlikeResult ?? ok(undefined));
    },
  } as unknown as UnlikeCommentUseCase;

  const store = configureCommentsStore({
    listComments,
    addComment,
    deleteComment,
    likeComment,
    unlikeComment,
  });

  return { store, likeCalls, unlikeCalls };
};

const seededStore = async (config: StubConfig) => {
  const ctx = makeStore(config);
  await ctx.store.getState().load(RECIPE_ID);
  return ctx;
};

const itemOf = (store: ReturnType<typeof makeStore>['store'], commentId: string) =>
  store.getState().byRecipe[RECIPE_ID].items.find((c) => c.id === commentId);

describe('commentsStore.toggleLike — like direction', () => {
  it('optimistically flips an unliked comment to liked before resolving', async () => {
    const { store } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
    });

    const pending = store.getState().toggleLike(RECIPE_ID, 'c1');

    const optimistic = itemOf(store, 'c1');
    expect(optimistic?.likedByMe).toBe(true);
    expect(optimistic?.likeCount).toBe(6);
    await pending;
  });

  it('calls likeComment and keeps the liked state on success', async () => {
    const { store, likeCalls, unlikeCalls } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
      likeResult: ok(undefined),
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'c1');

    expect(result.ok).toBe(true);
    expect(likeCalls).toEqual([{ recipeId: RECIPE_ID, commentId: 'c1' }]);
    expect(unlikeCalls).toHaveLength(0);
    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(true);
    expect(item?.likeCount).toBe(6);
  });

  it('rolls back to the original like state and returns the failure when likeComment fails', async () => {
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
    expect(item?.likeCount).toBe(5);
  });
});

describe('commentsStore.toggleLike — unlike direction', () => {
  it('calls unlikeComment and decrements the count on success', async () => {
    const { store, likeCalls, unlikeCalls } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: true, likeCount: 5 })],
      unlikeResult: ok(undefined),
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'c1');

    expect(result.ok).toBe(true);
    expect(unlikeCalls).toEqual([{ recipeId: RECIPE_ID, commentId: 'c1' }]);
    expect(likeCalls).toHaveLength(0);
    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(false);
    expect(item?.likeCount).toBe(4);
  });

  it('rolls back to liked when unlikeComment fails', async () => {
    const { store } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: true, likeCount: 5 })],
      unlikeResult: fail(new NetworkFailure('offline')),
    });

    await store.getState().toggleLike(RECIPE_ID, 'c1');

    const item = itemOf(store, 'c1');
    expect(item?.likedByMe).toBe(true);
    expect(item?.likeCount).toBe(5);
  });
});

describe('commentsStore.toggleLike — missing comment', () => {
  it('returns ok and calls neither use case when the comment is not in the list', async () => {
    const { store, likeCalls, unlikeCalls } = await seededStore({
      seed: [makeComment({ id: 'c1', likedByMe: false, likeCount: 5 })],
    });

    const result = await store.getState().toggleLike(RECIPE_ID, 'does-not-exist');

    expect(result.ok).toBe(true);
    expect(likeCalls).toHaveLength(0);
    expect(unlikeCalls).toHaveLength(0);
  });

  it('returns ok when the recipe has no loaded state at all', async () => {
    const { store, likeCalls, unlikeCalls } = makeStore({
      seed: [makeComment({ id: 'c1' })],
    });

    const result = await store.getState().toggleLike('never-loaded', 'c1');

    expect(result.ok).toBe(true);
    expect(likeCalls).toHaveLength(0);
    expect(unlikeCalls).toHaveLength(0);
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
