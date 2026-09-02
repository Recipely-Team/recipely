import type { BoundStore } from '@application/store/bound-store';
/**
 * Regression tests for `useRecipeDetail`'s comment-submit error copy.
 *
 * The bug: `handleAddComment` always set `submitError` to the static
 * `t().comments.error` ("Failed to post. Please try again.") whenever the post
 * failed — so a dropped connection or an expired session read as a generic
 * "try again" prompt, telling the user to retry something that could not
 * possibly succeed. The store had the real failure on `byRecipe[id].error` the
 * whole time; the hook simply never read it.
 *
 * The invariant locked in here: the copy shown to the user is resolved FROM the
 * store's failure (`failureToastMessage`), and the static string survives only
 * as the defensive fallback for the (production-unreachable) case where the
 * store reports `false` without recording a failure. Test 1 asserts the
 * resolved network copy verbatim, so the pre-fix implementation fails it.
 *
 * Strategy: the real `configureCommentsStore` is used (not a stub) so the
 * `error` field is written by production code — the exact seam the fix depends
 * on; only `AddCommentUseCase` is faked. The remaining stores are hand-built
 * Zustand stores supplied through a real `StoresProvider`, and the hook is
 * driven by a probe component — matching `use-save-recipe.test.tsx` and
 * `use-recipe-author.test.tsx`. Sibling hooks that only add unrelated reads
 * (author fetch, taxonomy labels, keyboard scrolling) and expo-router are
 * module-mocked.
 */

import { act, type ReactTestRenderer } from 'react-test-renderer';
import { create } from 'zustand';
import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CommentEntity } from '@domain/comments/comment-entity';
import type { CommentEntityProps } from '@domain/comments/comment-entity-props';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { Difficulty } from '@domain/recipes/difficulty';
import { configureCommentsStore } from '@application/comments/comments-store';
import { defaultRecipeCommentsState } from '@application/comments/list/default-recipe-comments-state';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { CommentsStoreState } from '@application/comments/comments-store-state';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { StoreStatus } from '@application/store/store-status';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRecipeDetail } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';
import { t } from '@presentation/i18n';

const RECIPE_ID = 'recipe-3';
const USER_ID = 'user-1';

// ─── module mocks ────────────────────────────────────────────────────────────

/**
 * One push spy for the whole file, not a fresh one per `useRouter()` call.
 *
 * @remarks
 * - **Why it has to be shared.** The old factory minted a new `jest.fn()` on
 *   every `useRouter()` call, and `useRecipeDetail` calls it on every render.
 *   Nothing outside the factory ever held one, so no test could assert a
 *   navigation had happened — not because the wrong spy was inspected, but
 *   because there was none to inspect.
 * - **Why the `mock` prefix.** Jest forbids a `jest.mock` factory from closing
 *   over anything else; a `mock`-prefixed name is the documented exemption.
 * - **Isolation.** `afterEach` clears call records, and no other test in this
 *   file touches `push` / `back` / `replace`.
 */
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockRouterPush, back: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => `/recipes/${'recipe-3'}`),
  useLocalSearchParams: jest.fn(() => ({ recipeId: 'recipe-3' })),
}));

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
}));

// Sibling hooks that only add unrelated reads (a DI-resolved author fetch, the
// taxonomy store, and RN Keyboard listeners) — none of them touch submitError.
jest.mock('@presentation/app/recipes/[recipeId]/hooks/use-recipe-author', () => ({
  useRecipeAuthor: jest.fn(() => ({ status: 'unavailable' })),
}));

jest.mock('@presentation/base/taxonomy/use-taxonomy-label', () => ({
  useTaxonomyLabel: jest.fn(() => ({
    cuisineLabel: () => ({ name: 'Italian', emoji: '🍝' }),
    categoryLabel: () => ({ name: 'Dinner', emoji: '🍽️' }),
  })),
}));

jest.mock('@presentation/app/recipes/[recipeId]/hooks/use-scroll-to-end-on-keyboard', () => ({
  useScrollToEndOnKeyboard: jest.fn(() => jest.fn()),
}));

// ─── fixtures ────────────────────────────────────────────────────────────────

const makeComment = (overrides: Partial<CommentEntityProps> = {}): CommentEntity => {
  const result = CommentEntity.create({
    id: 'c1',
    body: 'Looks delicious!',
    authorId: USER_ID,
    recipeId: RECIPE_ID,
    createdAt: new Date('2026-05-11T12:00:00.000Z'),
    authorDisplayName: 'Ada Lovelace',
    authorPhotoUrl: null,
    likeCount: 0,
    likedByMe: false,
    ...overrides,
  });
  if (!result.ok) throw new Error('Test setup expected a valid Comment');
  return result.value;
};

/** Unwraps a domain `Result`, throwing in-test if construction unexpectedly fails. */
const unwrap = <T,>(result: Result<T, Failure>): T => {
  if (!result.ok) throw new Error('Test fixture construction failed');
  return result.value;
};

const buildSession = (userId: string): AuthSessionEntity => {
  const email = unwrap(Email.create('test@example.com'));
  const user = unwrap(UserEntity.create({ id: userId, email, displayName: 'Test User' }));
  return unwrap(
    AuthSessionEntity.create({
      id: 'session-1',
      accessToken: 'access-token',
      expiresAt: new Date(Date.now() + 3_600_000),
      user,
    }),
  );
};

/**
 * Builds a real comments store whose `addComment` is backed by the given fake
 * use-case result — so `byRecipe[id].error` is written by the production
 * `createAddCommentAction`, not by the test.
 */
const makeRealCommentsStore = (
  execute: jest.Mock<Promise<Result<CommentEntity, Failure>>, [{ recipeId: string; body: string }]>,
): BoundStore<CommentsStoreState> =>
  configureCommentsStore({
    addComment: { execute } as unknown as AddCommentUseCase,
    listComments: { execute: jest.fn() } as unknown as ListCommentsUseCase,
    deleteComment: { execute: jest.fn() } as unknown as DeleteCommentUseCase,
    likeComment: { execute: jest.fn() } as unknown as LikeCommentUseCase,
    unlikeComment: { execute: jest.fn() } as unknown as UnlikeCommentUseCase,
  });

/**
 * Assembles the eight stores `useRecipeDetail` pulls from `useStores`. Only the
 * comments store carries real behaviour; the rest are seeded to the quietest
 * state that keeps the hook's effects from firing (recipe kept `loading` so no
 * fetch, no comment load, and no like sync runs during these tests).
 */
/**
 * A loaded recipe whose server-side like state is caller-supplied, for the
 * single-source-of-truth tests below.
 */
const buildRecipe = (likedByMe: boolean): RecipeEntity => {
  const result = RecipeEntity.create({
    id: RECIPE_ID,
    name: 'Baklava',
    cuisine: 'TURKISH',
    category: 'DESSERT',
    difficulty: Difficulty.Medium,
    ingredients: ['yufka'],
    instructions: ['bake'],
    prepTimeMinutes: 45,
    cookTimeMinutes: 35,
    servings: 1,
    caloriesPerServing: 0,
    image: 'https://cdn.example.com/baklava.webp',
    media: [],
    rating: 0,
    tags: [],
    mealType: [],
    ownerId: 'someone-else',
    likeCount: 7,
    likedByMe,
    viewCount: 60,
    moderationStatus: 'approved',
    commentCount: 1,
  });
  if (!result.ok) throw new Error('failed to build RecipeEntity fixture');
  return result.value;
};

interface StoreOverrides {
  /** Replaces the default `loading` detail state with a loaded recipe. */
  detailState?: RecipeDetailStoreState['byId'][string];
  /** Mounts signed-out, so the guest gate is the thing under test. */
  signedOut?: boolean;
  /** Seeds the likes-store overlay; empty by default (nothing synced yet). */
  likesByRecipe?: Record<string, { likeCount: number; likedByMe: boolean; isLoading: boolean }>;
}

const makeStores = (commentsStore: BoundStore<CommentsStoreState>, overrides: StoreOverrides = {}): Stores => {
  const recipeDetailStore = create<RecipeDetailStoreState>(() => ({
    byId: { [RECIPE_ID]: overrides.detailState ?? { status: 'loading' } },
    load: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    addPhoto: jest.fn(),
    removePhoto: jest.fn(),
    isPhotoBusy: false,
  }));

  const authStore = create<AuthStoreState>(
    () =>
      ({
        // The vocabulary, not the words. The `as unknown` cast below erases
        // the type check, so a misspelled literal would still yield
        // `userId === null`, still trip the guest gate, and still turn the
        // signed-out test green — passing for a reason that has nothing to do
        // with what it claims to prove.
        state: overrides.signedOut === true
          ? { status: StoreStatus.Unauthenticated }
          : { status: StoreStatus.Authenticated, session: buildSession(USER_ID) },
      }) as unknown as AuthStoreState,
  );

  const savedRecipesStore = create(() => ({ savedIds: new Set<string>() }));
  const favoritesStore = create(() => ({ isLoading: false, error: null }));
  const createdRecipesStore = create(() => ({
    findById: () => undefined,
    deleteState: { status: 'idle' as const },
    loadMyRecipes: jest.fn(),
  }));
  const likesStore = create(() => ({
    byRecipe: overrides.likesByRecipe ?? {},
    syncFromApi: jest.fn(),
  }));
  const userProfileStore = create(() => ({ state: { status: 'idle' as const }, load: jest.fn() }));

  return {
    recipeDetailStore,
    savedRecipesStore,
    createdRecipesStore,
    authStore,
    favoritesStore,
    commentsStore,
    likesStore,
    userProfileStore,
  } as unknown as Stores;
};

/** Renders a probe that captures the live hook output on every render. */
const driveHook = (
  commentsStore: BoundStore<CommentsStoreState>,
  overrides: StoreOverrides = {},
): { latest: () => UseRecipeDetailResult } => {
  let latest: UseRecipeDetailResult | null = null;

  const Probe = (): null => {
    latest = useRecipeDetail();
    return null;
  };

  const { renderer } = renderComponent(
    <StoresProvider value={makeStores(commentsStore, overrides)}>
      <Probe />
    </StoresProvider>,
  );
  mounted = renderer;

  return {
    latest: () => {
      if (latest === null) throw new Error('Probe never rendered');
      return latest;
    },
  };
};

/**
 * The tree each test mounted. Unmounted and settled in `afterEach`: the hook
 * loads the detail and the comments on mount, and a promise still in flight
 * when the environment is torn down surfaces as "import after teardown" — a
 * failure of the whole isolated run, however green the assertions were.
 */
let mounted: ReactTestRenderer | null = null;

/** Types a comment body into the input, then submits it and flushes the post. */
const typeAndSubmit = async (latest: () => UseRecipeDetailResult, body: string): Promise<void> => {
  await act(async () => {
    latest().onChangeCommentInput(body);
  });

  await act(async () => {
    latest().onAddComment();
  });
};

afterEach(async () => {
  await act(async () => {
    mounted?.unmount();
  });
  mounted = null;
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  jest.clearAllMocks();
});

// ─── the regression ──────────────────────────────────────────────────────────

describe('useRecipeDetail — submitError after a failed comment post', () => {
  it('shows the copy resolved from the store failure, not the generic retry string', async () => {
    const execute = jest.fn().mockResolvedValue(fail(new NetworkFailure('offline')));
    const { latest } = driveHook(makeRealCommentsStore(execute));

    await typeAndSubmit(latest, 'Great recipe!');

    // The network failure's own short copy ("You're offline") — the pre-fix
    // hook showed t().comments.error here regardless of what went wrong.
    expect(latest().submitError).toBe(t().errors.network.short);
    expect(latest().submitError).not.toBe(t().comments.error);
  });

  it('keeps the typed comment in the input so a failed post is not lost', async () => {
    const execute = jest.fn().mockResolvedValue(fail(new NetworkFailure('offline')));
    const { latest } = driveHook(makeRealCommentsStore(execute));

    await typeAndSubmit(latest, 'Great recipe!');

    expect(latest().commentInput).toBe('Great recipe!');
  });

  it('falls back to the generic error when the store records no failure', async () => {
    // The defensive branch: the real store always sets a failure alongside
    // `false`, so this shape only exists to keep submitError non-empty if that
    // contract ever breaks. A stub store is the only way to produce it.
    const commentsStore = create<CommentsStoreState>(() => ({
      byRecipe: { [RECIPE_ID]: { ...defaultRecipeCommentsState(), error: null } },
      load: jest.fn(),
      loadMore: jest.fn(),
      addComment: jest.fn().mockResolvedValue(false),
      deleteComment: jest.fn(),
      toggleLike: jest.fn(),
      clear: jest.fn(),
    })) as unknown as BoundStore<CommentsStoreState>;

    const { latest } = driveHook(commentsStore);

    await typeAndSubmit(latest, 'Great recipe!');

    expect(latest().submitError).toBe(t().comments.error);
  });
});

// ─── the success path ────────────────────────────────────────────────────────

describe('useRecipeDetail — submitError after a successful comment post', () => {
  it('clears a previous error and resets the input once the post succeeds', async () => {
    const execute = jest
      .fn()
      .mockResolvedValueOnce(fail(new NetworkFailure('offline')))
      .mockResolvedValueOnce(ok(makeComment()));
    const { latest } = driveHook(makeRealCommentsStore(execute));

    await typeAndSubmit(latest, 'Great recipe!');
    expect(latest().submitError).toBe(t().errors.network.short);

    await act(async () => {
      latest().onAddComment();
    });

    expect(latest().submitError).toBeNull();
    expect(latest().commentInput).toBe('');
  });

  it('does not post a whitespace-only comment', async () => {
    const execute = jest.fn().mockResolvedValue(ok(makeComment()));
    const { latest } = driveHook(makeRealCommentsStore(execute));

    await typeAndSubmit(latest, '   ');

    expect(execute).not.toHaveBeenCalled();
    expect(latest().submitError).toBeNull();
  });
});

/**
 * Reported as: like a recipe, close and reopen the app, and the heart is empty
 * again — then going back to the list showed it unliked there too.
 *
 * The root cause was a backend one (`GET /recipes/:id` carried no auth
 * middleware, so `likedByMe` came back false for everyone), fixed in
 * recipely-backend. These tests cover the client half: the view model exposed
 * TWO fields for one fact — `liked`, which fell back to the server value, and
 * `likedByMe`, which did not. The floating heart over the hero image read the
 * second one, so it rendered empty until the likes store synced and stayed
 * empty whenever that sync was skipped (it is skipped while an optimistic
 * toggle is in flight). Only `liked` survives, and it must honour the server.
 */
describe('useRecipeDetail — liked is the single source of truth', () => {
  const loaded = (likedByMe: boolean): StoreOverrides => ({
    detailState: { status: 'loaded', recipe: buildRecipe(likedByMe), fetchedAt: Date.now() },
  });

  it("reports the server's likedByMe before the likes store has any entry", () => {
    const { latest } = driveHook(makeRealCommentsStore(jest.fn()), loaded(true));

    // The regression: the heart that read the dropped `likedByMe` field showed
    // `false` here, contradicting the response that had just loaded.
    expect(latest().liked).toBe(true);
  });

  it('reports not-liked when the server says so', () => {
    const { latest } = driveHook(makeRealCommentsStore(jest.fn()), loaded(false));

    expect(latest().liked).toBe(false);
  });

  it('lets an optimistic likes-store overlay win over the loaded recipe', () => {
    const { latest } = driveHook(makeRealCommentsStore(jest.fn()), {
      ...loaded(false),
      likesByRecipe: { [RECIPE_ID]: { likeCount: 8, likedByMe: true, isLoading: true } },
    });

    // A toggle in flight must show immediately, otherwise the tap feels dead.
    expect(latest().liked).toBe(true);
    expect(latest().likeCount).toBe(8);
  });

  it('takes the like count from the loaded recipe when no overlay exists', () => {
    const { latest } = driveHook(makeRealCommentsStore(jest.fn()), loaded(true));

    expect(latest().likeCount).toBe(7);
  });
});

/**
 * Copying a recipe opens the editor seeded from it — and only for someone who
 * has somewhere to put the result.
 *
 * A copy becomes a DRAFT, which is server state. Without the gate a signed-out
 * visitor reaches the create screen, fills it in, and loses the lot at save —
 * the failure arrives after the work, which is the worst place to put it. The
 * gate is the same one `onToggleSave` uses; what these lock in is that copy is
 * behind it too, and that the route carries the recipe id rather than a prompt
 * (the assistant used to hand the words to the generator, which invented
 * something adjacent and called it the same recipe).
 */
describe('useRecipeDetail — copying a recipe to drafts', () => {
  it('opens the create screen seeded from this recipe', () => {
    const { latest } = driveHook(makeRealCommentsStore(jest.fn()));

    act(() => {
      latest().onCopyToDraft();
    });

    expect(mockRouterPush).toHaveBeenCalledWith(`/create-recipe?fromRecipeId=${RECIPE_ID}`);
  });

  it('asks a signed-out visitor to sign in instead of opening the editor', () => {
    const { latest } = driveHook(makeRealCommentsStore(jest.fn()), { signedOut: true });

    act(() => {
      latest().onCopyToDraft();
    });

    // The navigation is what must NOT happen: reaching the editor is what
    // costs the guest their work.
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(latest().promptVisible).toBe(true);
    expect(latest().promptMessage).toBe(t().recipes.signInToCopy);
  });
});
