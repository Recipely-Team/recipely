/**
 * What one tap on the recipe page re-renders.
 *
 * The page hook subscribed to the like, the saved flag, the in-flight save and
 * the step checklist, and handed one `vm` to every section, so a like re-drew
 * the photo viewer, the ingredients and steps, and the comments with it.
 *
 * Measured with React's `<Profiler>`: the real `useRecipeDetail` drives the
 * real `RecipeDetailContent` (phone layout) over a loaded recipe, each event
 * lands through its store, and the test counts which sections rendered.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockRenders: Record<string, number> = { page: 0, viewer: 0, overview: 0, steps: 0, comments: 0 };

// A declaration, not a const: jest.mock factories are hoisted above everything else.
// Counts the component's own renders: a memo wrapper is kept, the count sits inside it.
function mockCounted(module: string, name: string, key: string): object {
  const actual = jest.requireActual(module);
  const { memo } = jest.requireActual<typeof import('react')>('react');
  const exported = actual[name];
  const inner = exported.type ?? exported;
  const counted = (props: object) => {
    mockRenders[key] = (mockRenders[key] ?? 0) + 1;
    return inner(props);
  };
  return { ...actual, [name]: exported.type !== undefined ? memo(counted, exported.compare) : counted };
}

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/recipes/recipe-3'),
  useLocalSearchParams: jest.fn(() => ({ recipeId: 'recipe-3' })),
}));
jest.mock('@presentation/base/feedback/show-toast', () => ({ showErrorToast: jest.fn() }));
// Stable values, as the real hooks return: a fresh object per call would defeat the memo being measured.
const mockAuthor = { status: 'unavailable' };
const mockReveal = (): void => undefined;
jest.mock('@presentation/app/recipes/[recipeId]/hooks/use-recipe-author', () => ({
  useRecipeAuthor: () => mockAuthor,
}));
jest.mock('@presentation/base/taxonomy/use-taxonomy-label', () => ({
  useTaxonomyLabel: jest.fn(() => ({
    cuisineLabel: () => ({ name: 'Turkish', emoji: '🥙' }),
    categoryLabel: () => ({ name: 'Dessert', emoji: '🍰' }),
  })),
}));
jest.mock('@presentation/app/recipes/[recipeId]/hooks/use-scroll-to-end-on-keyboard', () => ({
  useScrollToEndOnKeyboard: () => mockReveal,
}));
jest.mock('@presentation/app/recipes/[recipeId]/items/media/recipe-photo-viewer', () =>
  mockCounted('@presentation/app/recipes/[recipeId]/items/media/recipe-photo-viewer', 'RecipePhotoViewer', 'viewer'),
);
jest.mock('@presentation/app/recipes/[recipeId]/body/recipe-overview', () =>
  mockCounted('@presentation/app/recipes/[recipeId]/body/recipe-overview', 'RecipeOverview', 'overview'),
);
jest.mock('@presentation/app/recipes/[recipeId]/body/recipe-steps', () =>
  mockCounted('@presentation/app/recipes/[recipeId]/body/recipe-steps', 'RecipeSteps', 'steps'),
);
jest.mock('@presentation/app/recipes/[recipeId]/body/recipe-comments-section', () =>
  mockCounted('@presentation/app/recipes/[recipeId]/body/recipe-comments-section', 'RecipeCommentsSection', 'comments'),
);

import { Profiler } from 'react';
import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { NetworkFailure } from '@core/failure';
import { fail } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { configureCommentsStore } from '@application/comments/comments-store';
import type { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import type { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import type { SetCommentLikeUseCase } from '@application/comments/like/set-comment-like-use-case';
import { configureStepProgressStore } from '@application/recipes/cooking/step-progress-store';
import { StoreStatus } from '@application/store/store-status';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRecipeDetail } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail';
import { RecipeDetailContent } from '@presentation/app/recipes/[recipeId]/body/recipe-detail-content';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';

const RECIPE_ID = 'recipe-3';
const USER_ID = 'user-1';

const unwrap = <T,>(result: { ok: true; value: T } | { ok: false }): T => {
  if (!result.ok) throw new Error('fixture construction failed');
  return result.value;
};

const recipe = unwrap(
  RecipeEntity.create({
    origin: RecipeOrigin.User,
    id: RECIPE_ID,
    name: 'Baklava',
    cuisine: 'TURKISH',
    category: 'DESSERT',
    difficulty: Difficulty.Medium,
    ingredients: Array.from({ length: 12 }, (_, at) => `${at + 1} cups ingredient ${at}`),
    instructions: Array.from({ length: 8 }, (_, at) => `Step ${at + 1}: do the next thing carefully.`),
    prepTimeMinutes: 45,
    cookTimeMinutes: 35,
    servings: 4,
    caloriesPerServing: 0,
    image: 'https://cdn.example.com/baklava.webp',
    media: [],
    rating: 0,
    tags: [],
    mealType: [],
    ownerId: 'someone-else',
    likeCount: 7,
    viewCount: 60,
    moderationStatus: 'approved',
    isPublished: true,
    commentCount: 0,
    sourcePlatform: null,
    aiWritten: false,
  }),
);

const session = unwrap(
  AuthSessionEntity.create({
    id: 'session-1',
    accessToken: 'access-token',
    expiresAt: new Date(Date.now() + 3_600_000),
    user: unwrap(UserEntity.create({ id: USER_ID, email: unwrap(Email.create('test@example.com')), displayName: 'Test User' })),
  }),
);

const highlight: UseCommentHighlightResult = {
  targetCommentId: null,
  highlightedCommentId: null,
  registerTargetNode: () => undefined,
  scrollViewProps: {},
};

const DetailPage = (): React.JSX.Element => {
  mockRenders['page'] = (mockRenders['page'] ?? 0) + 1;
  const vm = useRecipeDetail();
  return (
    <RecipeDetailContent vm={vm} isExpanded={false} ownerPhotoControls={undefined} commentHighlight={highlight} onBack={() => undefined} />
  );
};

const mount = () => {
  const stores = {
    recipeDetailStore: create(() => ({
      byId: { [RECIPE_ID]: { status: StoreStatus.Loaded, recipe, likedByMe: false, fetchedAt: Date.now() } },
      load: jest.fn(),
    })),
    savedRecipesStore: create(() => ({ savedIds: new Set<string>() })),
    favoritesStore: create(() => ({ isLoading: false, pending: new Set<string>(), error: null })),
    recipeAuthoringStore: create(() => ({ findById: () => undefined, deleteState: { status: 'idle' }, loadMyRecipes: jest.fn() })),
    authStore: create(() => ({ state: { status: StoreStatus.Authenticated, session } })),
    commentsStore: configureCommentsStore({
      addComment: { execute: jest.fn() } as unknown as AddCommentUseCase,
      listComments: { execute: jest.fn().mockResolvedValue(fail(new NetworkFailure('offline'))) } as unknown as ListCommentsUseCase,
      deleteComment: { execute: jest.fn() } as unknown as DeleteCommentUseCase,
      setCommentLike: { execute: jest.fn() } as unknown as SetCommentLikeUseCase,
    }),
    likesStore: create(() => ({ byRecipe: {}, syncFromApi: jest.fn(), seed: jest.fn() })),
    userProfileStore: create(() => ({ state: { status: 'idle' }, load: jest.fn() })),
    stepProgressStore: configureStepProgressStore(),
    dmArrivalStore: create(() => ({})),
    mealPlanStore: create(() => ({ enabled: false, checkEnabled: jest.fn() })),
    buildLoggableFoodFromRecipe: { execute: () => ({ ok: false }) },
  };
  let duration = 0;
  const meter = { on: false };
  renderComponent(
    <Profiler id="detail" onRender={(_id, _phase, actual) => { if (meter.on) duration += actual; }}>
      <DetailPage />
    </Profiler>,
    stores as unknown as Partial<ApplicationStores>,
  );
  return { stores, meter, duration: () => duration };
};

/** Runs `event` with the counters zeroed and returns what rendered. */
const measure = async (name: string, event: () => void) => {
  const { stores, meter, duration } = mount();
  await act(async () => undefined);
  for (const key of Object.keys(mockRenders)) mockRenders[key] = 0;
  meter.on = true;
  act(() => event.call(stores));
  meter.on = false;
  const result: Record<string, number> = { ...mockRenders, duration: duration() };
  if (process.env['PROFILE_RENDERS'] === '1') {
    process.stdout.write(
      `[profile] detail ${name}: ${Object.entries(mockRenders).map(([k, v]) => `${k}=${v}`).join(' ')} actualDuration=${result.duration.toFixed(1)}ms\n`,
    );
  }
  return { stores, result };
};

describe('one tap on the recipe page re-renders only the part it changes', () => {
  it('a like does not re-draw the photos, the steps or the comments', async () => {
    const { result } = await measure('like', function (this: ReturnType<typeof mount>['stores']) {
      this.likesStore.setState({ byRecipe: { [RECIPE_ID]: { likeCount: 8, likedByMe: true, isLoading: false } } });
    });
    expect(result['viewer']).toBe(0);
    expect(result['steps']).toBe(0);
    expect(result['comments']).toBe(0);
  });

  it('a save does not re-draw the photos, the overview, the steps or the comments', async () => {
    const { result } = await measure('save', function (this: ReturnType<typeof mount>['stores']) {
      this.savedRecipesStore.setState({ savedIds: new Set([RECIPE_ID]) });
    });
    expect(result['viewer']).toBe(0);
    expect(result['overview']).toBe(0);
    expect(result['steps']).toBe(0);
    expect(result['comments']).toBe(0);
  });

  it('a step tick does not re-draw the photos, the overview or the comments', async () => {
    const { result } = await measure('step', function (this: ReturnType<typeof mount>['stores']) {
      this.stepProgressStore.getState().toggleStep(RECIPE_ID, 0);
    });
    expect(result['viewer']).toBe(0);
    expect(result['overview']).toBe(0);
    expect(result['comments']).toBe(0);
    expect(result['steps']).toBeGreaterThan(0);
  });
});
