/**
 * Regression tests for `useRecipeList`'s `isPullRefreshing` flag.
 *
 * The bug: on iOS, tapping a cuisine filter made the list slide down and snap
 * back like a pull-to-refresh. `recipe-list-body` drove `RefreshControl.refreshing`
 * from the store's `isRecipeListRefreshing(state)`, which is true for EVERY
 * in-place refetch (filter/sort/locale/focus) — and setting `refreshing`
 * programmatically on iOS calls `UIRefreshControl.beginRefreshing`, animating
 * the scroll view down to reveal the spinner and back when cleared.
 *
 * The invariant locked in here: `isPullRefreshing` tracks ONLY a user-initiated
 * pull, never any other refetch — so the suite asserts the store IS refreshing
 * while the flag stays false, which is exactly what the old wiring got wrong.
 *
 * The suite drives the hook through a probe component (react-test-renderer has
 * no `renderHook`, and `@testing-library/react-native` is not a dependency of
 * this repo — same pattern as `use-refresh-failure-toast.test.tsx`). It records
 * EVERY render rather than just the last, so an intermediate frame that flipped
 * the spinner on and off within the in-flight window can't slip through.
 *
 * The real `configureRecipeListStore` is used (not a stub) so `isRefreshing`
 * transitions come from production code; only `ListRecipesUseCase` is faked, with
 * a deferred promise for timing control — same seam as `recipe-list-store.test.ts`.
 *
 * The stuck-spinner guard is covered twice: via a failed refresh (a `Result`
 * failure), which is how a load reports an error here — every layer down to the
 * HTTP client returns `Result` and never throws (CLAUDE.md §12) — and via a
 * rejecting load, the defensive path behind `onRefresh`'s catch/finally.
 */

import { act, type ReactTestRenderer } from 'react-test-renderer';
import { create } from 'zustand';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useRecipeList } from '@presentation/app/recipes/hooks/use-recipe-list';
import { SEARCH_DEBOUNCE_MS } from '@presentation/app/recipes/model/search-debounce';
import { configureRecipeListStore } from '@application/recipes/list/configure-recipe-list-store';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import type { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';
import type { RecipeListStore } from '@application/recipes/list/recipe-list-store';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/recipes'),
  // The real hook runs its callback whenever the screen gains focus; an effect
  // is close enough here (the hook skips the mount focus via its own ref).
  useFocusEffect: jest.fn((callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  }),
}));

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
}));

// Sibling hooks that only add unrelated store reads (favorites, taxonomy labels).
jest.mock('@presentation/base/hooks/recipes/use-save-recipe', () => ({
  useSaveRecipe: jest.fn(() => ({ isSaved: () => false, toggleSave: jest.fn() })),
}));

jest.mock('@presentation/base/taxonomy/use-taxonomy-label', () => ({
  useTaxonomyLabel: jest.fn(() => ({
    cuisineLabel: (key: string) => ({ name: key, emoji: '🍝' }),
    categoryLabel: (key: string) => ({ name: key, emoji: '🍽️' }),
  })),
}));

type ListResult = Result<RecipeSummaryEntity[], Failure>;

/** A promise plus the handle to settle it, so a load can be held in flight. */
interface Deferred {
  promise: Promise<ListResult>;
  resolve: (result: ListResult) => void;
}

const makeDeferred = (): Deferred => {
  let resolve: (result: ListResult) => void = () => {};
  const promise = new Promise<ListResult>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const makeRecipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name: `Recipe ${id}`,
    image: `https://cdn.example.com/${id}.webp`,
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const makeAuthStore = () =>
  create<AuthStoreState>(() => ({
    state: { status: 'unauthenticated' },
  }) as unknown as AuthStoreState);

const makeNotificationsStore = () =>
  create<NotificationsStoreState>(() => ({
    unreadCount: 0,
  }) as unknown as NotificationsStoreState);

const makeSavedRecipesStore = () =>
  create<SavedRecipesStoreState>(() => ({
    savedIds: new Set<string>(),
    setSavedIds: jest.fn(),
  }) as unknown as SavedRecipesStoreState);

const makeStores = (recipeListStore: RecipeListStore): Stores =>
  ({
    recipeListStore,
    authStore: makeAuthStore(),
    notificationsStore: makeNotificationsStore(),
    savedRecipesStore: makeSavedRecipesStore(),
    loadFavoritesUseCase: { execute: jest.fn().mockResolvedValue(ok([])) },
  }) as unknown as Stores;

/** One render of the hook: the spinner flag next to what the store reports. */
interface RenderSnapshot {
  isPullRefreshing: boolean;
  isStoreRefreshing: boolean;
}

// The suite also covers load-parameter regressions: the initial load and the
// filter reset must send the same `sort` as every other refetch path, or the
// backend's fallback ordering makes the list reshuffle on the first focus refetch.
describe('useRecipeList — pull-to-refresh spinner and load parameters', () => {
  let renders: RenderSnapshot[] = [];
  let vm: ReturnType<typeof useRecipeList>;
  let renderer: ReactTestRenderer | null = null;

  const Probe = (): null => {
    vm = useRecipeList();
    renders.push({
      isPullRefreshing: vm.isPullRefreshing,
      isStoreRefreshing: isRecipeListRefreshing(vm.state),
    });
    return null;
  };

  /** Mounts the hook and settles the initial auto-load into a `loaded` list. */
  const mountLoaded = async (
    execute: jest.Mock,
  ): Promise<void> => {
    const store = configureRecipeListStore({
      listRecipes: { execute } as unknown as ListRecipesUseCase,
    });

    execute.mockReturnValueOnce(Promise.resolve(ok([makeRecipe('r1')])));

    renderer = renderComponent(
      <StoresProvider value={makeStores(store)}>
        <Probe />
      </StoresProvider>,
    ).renderer;

    await act(async () => {
      await Promise.resolve();
    });
  };

  /** Everything rendered after the given index — the in-flight window. */
  const rendersSince = (index: number): RenderSnapshot[] => renders.slice(index);

  beforeEach(() => {
    renders = [];
    renderer = null;
  });

  afterEach(async () => {
    // Unmount before settling: the hook debounces the search query on a timer,
    // and a tree left mounted keeps that timer alive past the end of the test —
    // it then fires into a torn-down Jest environment. Unmounting runs the
    // hook's own cleanup, which is what cancels it.
    await act(async () => {
      renderer?.unmount();
    });
    // Let AppThemeProvider's async storage hydration settle inside act, so a
    // late re-render can't fire after the Jest environment is torn down.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('leaves isPullRefreshing false for the whole in-flight window of a filter refetch', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);
    expect(vm.state.status).toBe('loaded');

    const deferred = makeDeferred();
    execute.mockReturnValueOnce(deferred.promise);
    const beforeToggle = renders.length;

    act(() => {
      vm.onToggleCuisineQuick(CuisineKey.Turkish);
    });

    // The store IS refreshing — this is precisely the state the old
    // `refreshing={isRecipeListRefreshing(state)}` wiring turned into a
    // spinner (and an iOS scroll jump) on a plain filter tap.
    expect(isRecipeListRefreshing(vm.state)).toBe(true);
    expect(vm.isPullRefreshing).toBe(false);
    expect(rendersSince(beforeToggle).some((r) => r.isStoreRefreshing)).toBe(true);
    expect(rendersSince(beforeToggle).every((r) => !r.isPullRefreshing)).toBe(true);

    await act(async () => {
      deferred.resolve(ok([makeRecipe('r2')]));
      await deferred.promise;
    });

    expect(vm.isPullRefreshing).toBe(false);
    expect(renders.every((r) => !r.isPullRefreshing)).toBe(true);
  });

  /**
   * "Recipes look like they load twice on the home page." A filter tap kept the
   * previous rows up while the next set arrived, so one tap showed two sets in
   * sequence. The feed now blanks its rows for exactly the loads that change
   * WHAT it should contain — and for no others.
   */
  it('reports isReloadingResults for a filter change, until the results land', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);
    expect(vm.isReloadingResults).toBe(false);

    const deferred = makeDeferred();
    execute.mockReturnValueOnce(deferred.promise);

    act(() => {
      vm.onToggleCuisineQuick(CuisineKey.Turkish);
    });
    expect(vm.isReloadingResults).toBe(true);

    await act(async () => {
      deferred.resolve(ok([makeRecipe('r2')]));
      await deferred.promise;
    });

    expect(vm.isReloadingResults).toBe(false);
  });

  it('leaves isReloadingResults false for a pull-to-refresh', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);

    const deferred = makeDeferred();
    execute.mockReturnValueOnce(deferred.promise);

    act(() => {
      vm.onRefresh();
    });

    // The pull has its own spinner, and its rows must stay under the finger.
    expect(vm.isPullRefreshing).toBe(true);
    expect(vm.isReloadingResults).toBe(false);

    await act(async () => {
      deferred.resolve(ok([makeRecipe('r2')]));
      await deferred.promise;
    });
  });

  it('leaves isPullRefreshing false for the whole in-flight window of a sort refetch', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);

    const deferred = makeDeferred();
    execute.mockReturnValueOnce(deferred.promise);
    const beforeSort = renders.length;

    act(() => {
      vm.onChangeSort('newest');
    });

    expect(isRecipeListRefreshing(vm.state)).toBe(true);
    expect(rendersSince(beforeSort).every((r) => !r.isPullRefreshing)).toBe(true);

    await act(async () => {
      deferred.resolve(ok([makeRecipe('r2')]));
      await deferred.promise;
    });

    expect(renders.every((r) => !r.isPullRefreshing)).toBe(true);
  });

  it('sets isPullRefreshing true while a pull-initiated refetch is in flight', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);

    const deferred = makeDeferred();
    execute.mockReturnValueOnce(deferred.promise);

    act(() => {
      vm.onRefresh();
    });

    expect(vm.isPullRefreshing).toBe(true);

    await act(async () => {
      deferred.resolve(ok([makeRecipe('r2')]));
      await deferred.promise;
    });

    expect(vm.isPullRefreshing).toBe(false);
  });

  it('clears isPullRefreshing once a pull-initiated refetch settles into a failure', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);

    const failure = new NetworkFailure('offline');
    const deferred = makeDeferred();
    execute.mockReturnValueOnce(deferred.promise);

    act(() => {
      vm.onRefresh();
    });
    expect(vm.isPullRefreshing).toBe(true);

    await act(async () => {
      deferred.resolve({ ok: false, failure });
      await deferred.promise;
    });

    // A failed refresh must not strand the spinner: the list stays visible
    // (stale recipes + refreshFailure) and the pull indicator goes away.
    expect(vm.isPullRefreshing).toBe(false);
    expect(vm.state.status).toBe('loaded');
  });

  it('does not re-arm the spinner when a filter refetch follows a pull-refresh', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);

    const pull = makeDeferred();
    execute.mockReturnValueOnce(pull.promise);
    act(() => {
      vm.onRefresh();
    });
    await act(async () => {
      pull.resolve(ok([makeRecipe('r2')]));
      await pull.promise;
    });
    expect(vm.isPullRefreshing).toBe(false);

    const filter = makeDeferred();
    execute.mockReturnValueOnce(filter.promise);
    const beforeToggle = renders.length;

    act(() => {
      vm.onToggleCuisineQuick(CuisineKey.Turkish);
    });

    // A pull immediately followed by a filter tap must not leave the flag
    // latched on: the filter refetch is not user-initiated.
    expect(isRecipeListRefreshing(vm.state)).toBe(true);
    expect(rendersSince(beforeToggle).every((r) => !r.isPullRefreshing)).toBe(true);

    await act(async () => {
      filter.resolve(ok([makeRecipe('r3')]));
      await filter.promise;
    });

    expect(vm.isPullRefreshing).toBe(false);
  });

  it('sends the advertised default sort on the initial load', async () => {
    // Regression: a bare `load()` on mount fell back to the backend's default
    // ordering (createdAt desc) while the header showed "popular" — so the
    // focus refetch (which does send sort=popular) visibly reshuffled the list
    // the first time the user came back from a recipe detail.
    const execute = jest.fn();
    await mountLoaded(execute);

    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ sort: 'popular' }));
  });

  it('keeps the active sort but clears filters when filters are reset', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);

    execute.mockReturnValueOnce(Promise.resolve(ok([makeRecipe('r2')])));
    act(() => {
      vm.onChangeSort('rating');
    });
    await act(async () => {
      await Promise.resolve();
    });

    execute.mockReturnValueOnce(Promise.resolve(ok([makeRecipe('r3')])));
    act(() => {
      vm.onToggleCuisineQuick(CuisineKey.Turkish);
    });
    await act(async () => {
      await Promise.resolve();
    });

    execute.mockReturnValueOnce(Promise.resolve(ok([makeRecipe('r4')])));
    act(() => {
      vm.onResetFilters();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const lastCall = execute.mock.calls.at(-1)?.[0];
    expect(lastCall).toEqual(expect.objectContaining({ sort: 'rating' }));
    expect(lastCall).not.toHaveProperty('cuisines');
  });

  /**
   * The Android bug: search ran as a local `Array.filter` over the loaded page.
   * That page is only the first slice of the catalogue, so a query could only
   * ever match recipes already downloaded and silently missed the rest. Search
   * is a backend filter (`RecipeFilters.search`), debounced so a typing burst is
   * one request instead of one per keystroke.
   */
  describe('search', () => {
    /** Advances past the debounce window and lets the resulting load settle. */
    const settleSearch = async (): Promise<void> => {
      await act(async () => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
        await Promise.resolve();
      });
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sends the query to the backend once the typing pauses', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);

      execute.mockReturnValueOnce(Promise.resolve(ok([makeRecipe('r2')])));
      act(() => {
        vm.onSearchChange('pasta');
      });
      await settleSearch();

      expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'pasta' }));
    });

    it('collapses a burst of keystrokes into a single request', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);
      const callsAfterMount = execute.mock.calls.length;

      execute.mockReturnValue(Promise.resolve(ok([makeRecipe('r2')])));
      act(() => {
        vm.onSearchChange('p');
        vm.onSearchChange('pa');
        vm.onSearchChange('pas');
        vm.onSearchChange('pasta');
      });
      await settleSearch();

      // One request for the settled query — not four.
      expect(execute.mock.calls.length - callsAfterMount).toBe(1);
      expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'pasta' }));
    });

    it('reports isRefetching from the keystroke, before the debounce even fires', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);
      expect(vm.isRefetching).toBe(false);

      execute.mockReturnValue(Promise.resolve(ok([makeRecipe('r2')])));
      act(() => {
        vm.onSearchChange('pasta');
      });

      // The gap between the keystroke and the request is still "the rows you can
      // see are out of date" — treating it as idle is what let the search
      // surface flash the previous query's results (or "no matches") mid-typing.
      expect(vm.isRefetching).toBe(true);

      await settleSearch();
      expect(vm.isRefetching).toBe(false);
    });

    it('drops the search param entirely once the field is cleared', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);

      execute.mockReturnValue(Promise.resolve(ok([makeRecipe('r2')])));
      act(() => {
        vm.onSearchChange('pasta');
      });
      await settleSearch();

      act(() => {
        vm.onSearchChange('');
      });
      await settleSearch();

      // An empty `search=` would ask the backend to match the empty string
      // rather than to stop filtering.
      expect(execute.mock.calls.at(-1)?.[0]).not.toHaveProperty('search');
    });

    it('keeps the query when a filter changes, so the two compose', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);

      execute.mockReturnValue(Promise.resolve(ok([makeRecipe('r2')])));
      act(() => {
        vm.onSearchChange('pasta');
      });
      await settleSearch();

      act(() => {
        vm.onToggleCuisineQuick(CuisineKey.Turkish);
      });
      await act(async () => {
        await Promise.resolve();
      });

      // A filter tap that dropped the query would silently widen the results
      // back to the whole catalogue while the search field still showed "pasta".
      expect(execute.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({ search: 'pasta', cuisines: [CuisineKey.Turkish] }),
      );
    });

    it('hands back no rows while the typed query is unanswered', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);
      expect(vm.recipes).toHaveLength(1);

      const inFlight = makeDeferred();
      execute.mockReturnValueOnce(inFlight.promise);
      act(() => {
        vm.onSearchChange('pasta');
      });

      // The store still holds the unfiltered feed here. Handing it back is what
      // made one keystroke look like it had matched the entire catalogue.
      expect(vm.recipes).toEqual([]);

      await act(async () => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
        await Promise.resolve();
      });
      expect(vm.recipes).toEqual([]);

      await act(async () => {
        inFlight.resolve(ok([makeRecipe('match')]));
        await Promise.resolve();
      });

      expect(vm.recipes.map((r) => r.id)).toEqual(['match']);
    });

    it('never reports an unanswered query as idle, so the empty state cannot flash', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);

      const inFlight = makeDeferred();
      execute.mockReturnValueOnce(inFlight.promise);
      act(() => {
        vm.onSearchChange('pasta');
      });

      // Every frame from the keystroke to the answer must claim to be loading:
      // `recipes` is empty across all of them, and one idle frame in between is
      // a flash of "no results" at the start of every search. The debounce
      // fires during render while `load` only marks the store refreshing in the
      // effect after it, which is exactly where that frame used to appear.
      const framesAreLoading: boolean[] = [vm.isRefetching];
      await act(async () => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
        await Promise.resolve();
      });
      framesAreLoading.push(vm.isRefetching);

      expect(framesAreLoading).toEqual([true, true]);

      await act(async () => {
        inFlight.resolve(ok([makeRecipe('match')]));
        await Promise.resolve();
      });
      expect(vm.isRefetching).toBe(false);
    });

    it('stops claiming to load when the search itself fails, so the spinner cannot stick', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);

      execute.mockReturnValueOnce(Promise.resolve(fail(new NetworkFailure('offline'))));
      act(() => {
        vm.onSearchChange('pasta');
      });
      await settleSearch();

      // The query stays unanswered for good — a spinner keyed only on "answered
      // yet?" would never stop. The failure toast reports what happened.
      expect(vm.isRefetching).toBe(false);
      expect(vm.recipes).toEqual([]);
    });

    it('shows the feed again the moment the field is cleared, not the last query\'s results', async () => {
      const execute = jest.fn();
      await mountLoaded(execute);

      execute.mockReturnValueOnce(Promise.resolve(ok([makeRecipe('match')])));
      act(() => {
        vm.onSearchChange('pasta');
      });
      await settleSearch();
      expect(vm.recipes.map((r) => r.id)).toEqual(['match']);

      const inFlight = makeDeferred();
      execute.mockReturnValueOnce(inFlight.promise);
      act(() => {
        vm.onSearchChange('');
      });

      // Staleness cuts both ways: the search hits are no more the feed than the
      // feed was a set of search hits.
      expect(vm.recipes).toEqual([]);
      // …and the feed body must be told it is reloading, or the withheld rows
      // read as "no recipes yet, try again" for the length of the debounce.
      expect(vm.isReloadingResults).toBe(true);

      await act(async () => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
        inFlight.resolve(ok([makeRecipe('r1'), makeRecipe('r2')]));
        await Promise.resolve();
      });

      expect(vm.recipes).toHaveLength(2);
    });
  });

  it('clears isPullRefreshing and leaks no unhandled rejection when the load rejects', async () => {
    const execute = jest.fn();
    await mountLoaded(execute);
    execute.mockImplementationOnce(() => Promise.reject(new Error('boom')));

    // `onRefresh` fires its reload from a `void`ed async IIFE, so a rejection can
    // only surface process-wide. The listener IS the assertion: without the
    // `catch` in `onRefresh` this fires, and registering it also keeps Node from
    // killing the run outright, so the regression reads as a clean failure.
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);

    try {
      await act(async () => {
        vm.onRefresh();
        // A macrotask turn: Node only emits `unhandledRejection` once the
        // microtask queue has drained with no handler attached.
        await new Promise((resolve) => setImmediate(resolve));
      });

      expect(vm.isPullRefreshing).toBe(false);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});
