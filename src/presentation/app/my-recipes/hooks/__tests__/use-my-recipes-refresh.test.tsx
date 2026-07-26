/**
 * Tests for `useMyRecipesRefresh` — the My-Recipes pull-to-refresh hook.
 *
 * Two things are pinned here.
 *
 * 1. Per-tab dispatch. The saved grid renders `recipeList.recipes` filtered by
 *    `savedIds`, so a refresh that reloaded only one of the two would render a
 *    stale intersection — the suite asserts both loads start CONCURRENTLY (the
 *    favorites call is made while the recipe load is still in flight, which a
 *    sequential `await` would fail). The created and drafts tabs each own a
 *    single load, and every case asserts the other tabs' loaders stay untouched.
 *
 * 2. The PR #161 invariant: `isRefreshing` tracks ONLY a user-initiated pull.
 *    It is bound straight to `RefreshControl.refreshing`, and setting that
 *    programmatically on iOS calls `UIRefreshControl.beginRefreshing`, animating
 *    the scroll view down and back — a visible jump. So a tab switch or a store's
 *    own refresh flag must leave the flag false.
 *
 * The hook is driven through a probe component (react-test-renderer has no
 * `renderHook`, and `@testing-library/react-native` is not a dependency of this
 * repo) — same pattern as `use-recipe-list.test.tsx`. The probe mirrors the
 * screen: it holds `tab` in local state and subscribes to `recipeListStore.state`,
 * so a store refresh genuinely re-renders it. EVERY render is recorded rather
 * than just the last, so an intermediate frame that flipped the spinner on and
 * off inside the window can't slip through.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useMyRecipesRefresh } from '@presentation/app/my-recipes/hooks/use-my-recipes-refresh';
import type { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import type { RecipeListState } from '@application/recipes/list/recipe-list-state';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import type { CreatedRecipesStoreState } from '@application/recipes/my-recipes/created-recipes-store-state';
import type { DraftsStoreState } from '@application/drafts/drafts-store-state';
import { NetworkFailure } from '@core/failure';
import { ok, fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
}));

const showErrorToastMock = showErrorToast as jest.MockedFunction<typeof showErrorToast>;

type FavoritesResult = Result<Set<string>, Failure>;

/** A promise plus the handle to settle it, so a load can be held in flight. */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
}

const makeDeferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** Every loader the hook can reach, so each test can assert on the road not taken. */
interface Loaders {
  loadRecipes: jest.Mock<Promise<void>, []>;
  loadFavorites: jest.Mock<Promise<FavoritesResult>, []>;
  setSavedIds: jest.Mock<void, [Set<string>]>;
  loadMyRecipes: jest.Mock<Promise<void>, []>;
  loadDrafts: jest.Mock<Promise<void>, []>;
}

const makeLoaders = (): Loaders => ({
  loadRecipes: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  loadFavorites: jest.fn<Promise<FavoritesResult>, []>().mockResolvedValue(ok(new Set<string>())),
  setSavedIds: jest.fn<void, [Set<string>]>(),
  loadMyRecipes: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  loadDrafts: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
});

const IDLE_STATE: RecipeListState = { status: 'idle' };

/**
 * The store bundle the hook resolves through DI. `recipeListStore` is a real
 * Zustand store so the probe's `state` subscription (and the refresh-flag
 * transition it drives) behaves like production; the loads themselves are the
 * seam under test.
 */
const makeStores = (loaders: Loaders) => {
  const recipeListStore = create<RecipeListStoreState>(() => ({
    state: IDLE_STATE,
    load: loaders.loadRecipes,
    replace: jest.fn(),
    remove: jest.fn(),
  }));

  const savedRecipesStore = create<SavedRecipesStoreState>(() => ({
    savedIds: new Set<string>(),
    setSavedIds: loaders.setSavedIds,
  }) as unknown as SavedRecipesStoreState);

  const createdRecipesStore = create<CreatedRecipesStoreState>(() => ({
    recipes: [],
    loadMyRecipes: loaders.loadMyRecipes,
  }) as unknown as CreatedRecipesStoreState);

  const draftsStore = create<DraftsStoreState>(() => ({
    drafts: [],
    loadDrafts: loaders.loadDrafts,
  }) as unknown as DraftsStoreState);

  const stores = {
    recipeListStore,
    savedRecipesStore,
    createdRecipesStore,
    draftsStore,
    loadFavoritesUseCase: { execute: loaders.loadFavorites },
  } as unknown as Stores;

  return { stores, recipeListStore };
};

/** One render of the hook: the spinner flag next to what the store reports. */
interface RenderSnapshot {
  isRefreshing: boolean;
  isStoreRefreshing: boolean;
}

describe('useMyRecipesRefresh', () => {
  let renders: RenderSnapshot[] = [];
  let vm: ReturnType<typeof useMyRecipesRefresh>;
  let setTab: (tab: TabType) => void = () => {};
  // Rebound by `mount` to read the live store — the probe mirrors the screen,
  // which subscribes to `state`, so a store refresh re-renders the hook's
  // consumer and the guard below has something to catch.
  let useStoreState: () => RecipeListState = () => IDLE_STATE;

  const Probe = ({ tab }: { tab: TabType }): null => {
    vm = useMyRecipesRefresh(tab);
    const state = useStoreState();
    renders.push({ isRefreshing: vm.isRefreshing, isStoreRefreshing: isRecipeListRefreshing(state) });
    return null;
  };

  const Harness = ({ initialTab }: { initialTab: TabType }): React.JSX.Element => {
    const [tab, setTabState] = useState<TabType>(initialTab);
    setTab = setTabState;
    return <Probe tab={tab} />;
  };

  /** Mounts the hook on `tab` and returns the loaders + the live recipe-list store. */
  const mount = (tab: TabType) => {
    const loaders = makeLoaders();
    const { stores, recipeListStore } = makeStores(loaders);
    useStoreState = () => recipeListStore((s) => s.state);

    renderComponent(
      <StoresProvider value={stores}>
        <Harness initialTab={tab} />
      </StoresProvider>,
    );

    return { loaders, recipeListStore };
  };

  /** Everything rendered after the given index — the in-flight window. */
  const rendersSince = (index: number): RenderSnapshot[] => renders.slice(index);

  beforeEach(() => {
    renders = [];
    showErrorToastMock.mockClear();
  });

  afterEach(async () => {
    // Let AppThemeProvider's async storage hydration settle inside act, so a
    // late re-render can't fire after the Jest environment is torn down.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  describe('per-tab dispatch', () => {
    it('reloads the recipe list and the favorites concurrently when the saved tab is pulled', async () => {
      const { loaders } = mount('saved');
      const recipes = makeDeferred<void>();
      loaders.loadRecipes.mockReturnValueOnce(recipes.promise);

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      // The saved grid is `recipes` filtered by `savedIds`. Both loads must be
      // in flight together: with a sequential `await loadRecipes()` first, the
      // favorites call would not have happened yet at this point.
      expect(loaders.loadRecipes).toHaveBeenCalledTimes(1);
      expect(loaders.loadFavorites).toHaveBeenCalledTimes(1);

      await act(async () => {
        recipes.resolve();
        await recipes.promise;
      });

      expect(loaders.setSavedIds).toHaveBeenCalledTimes(1);
      expect(loaders.loadMyRecipes).not.toHaveBeenCalled();
      expect(loaders.loadDrafts).not.toHaveBeenCalled();
    });

    it('hands the loaded favorite ids to the saved-recipes store', async () => {
      const { loaders } = mount('saved');
      loaders.loadFavorites.mockResolvedValueOnce(ok(new Set(['r1', 'r2'])));

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      expect(loaders.setSavedIds).toHaveBeenCalledWith(new Set(['r1', 'r2']));
    });

    it('reloads only the created recipes when the created tab is pulled', async () => {
      const { loaders } = mount('created');

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      expect(loaders.loadMyRecipes).toHaveBeenCalledTimes(1);
      expect(loaders.loadRecipes).not.toHaveBeenCalled();
      expect(loaders.loadFavorites).not.toHaveBeenCalled();
      expect(loaders.loadDrafts).not.toHaveBeenCalled();
    });

    it('reloads only the drafts when the drafts tab is pulled', async () => {
      const { loaders } = mount('drafts');

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      expect(loaders.loadDrafts).toHaveBeenCalledTimes(1);
      expect(loaders.loadRecipes).not.toHaveBeenCalled();
      expect(loaders.loadFavorites).not.toHaveBeenCalled();
      expect(loaders.loadMyRecipes).not.toHaveBeenCalled();
    });

    it('dispatches to the tab that is active at pull time, not the one it mounted on', async () => {
      const { loaders } = mount('saved');

      act(() => {
        setTab('drafts');
      });
      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      // Guards a stale `tab` closure in `onRefresh`'s dependency list.
      expect(loaders.loadDrafts).toHaveBeenCalledTimes(1);
      expect(loaders.loadRecipes).not.toHaveBeenCalled();
      expect(loaders.loadFavorites).not.toHaveBeenCalled();
    });
  });

  describe('isRefreshing lifecycle', () => {
    it('is false before any pull', () => {
      mount('saved');

      expect(vm.isRefreshing).toBe(false);
      expect(renders.every((r) => !r.isRefreshing)).toBe(true);
    });

    it('is true while a pull is in flight and false once it settles', async () => {
      const { loaders } = mount('created');
      const load = makeDeferred<void>();
      loaders.loadMyRecipes.mockReturnValueOnce(load.promise);

      act(() => {
        vm.onRefresh();
      });

      expect(vm.isRefreshing).toBe(true);

      await act(async () => {
        load.resolve();
        await load.promise;
      });

      expect(vm.isRefreshing).toBe(false);
    });

    // THE PR #161 REGRESSION GUARD — the point of this suite.
    it('never turns isRefreshing true for a tab change or a store refresh — only an explicit pull does', async () => {
      const { loaders, recipeListStore } = mount('saved');

      // A store-driven refresh: exactly the state the PR #161 bug turned into a
      // spinner (and an iOS scroll jump) without the user pulling anything.
      const refreshingState: RecipeListState = { status: 'loaded', recipes: [], isRefreshing: true };
      act(() => {
        recipeListStore.setState({ state: refreshingState });
      });

      expect(isRecipeListRefreshing(refreshingState)).toBe(true);
      expect(renders.some((r) => r.isStoreRefreshing)).toBe(true);

      // Tab changes, the other trigger that must not arm the spinner.
      act(() => {
        setTab('created');
      });
      act(() => {
        setTab('drafts');
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(vm.isRefreshing).toBe(false);
      expect(renders.every((r) => !r.isRefreshing)).toBe(true);
      // A tab switch must not refetch either — only a pull loads.
      expect(loaders.loadRecipes).not.toHaveBeenCalled();
      expect(loaders.loadFavorites).not.toHaveBeenCalled();
      expect(loaders.loadMyRecipes).not.toHaveBeenCalled();
      expect(loaders.loadDrafts).not.toHaveBeenCalled();

      // Non-vacuity: the same probe DOES report true for a real pull, so the
      // assertions above are about the trigger, not a flag that never flips.
      const load = makeDeferred<void>();
      loaders.loadDrafts.mockReturnValueOnce(load.promise);
      const beforePull = renders.length;

      act(() => {
        vm.onRefresh();
      });

      expect(rendersSince(beforePull).some((r) => r.isRefreshing)).toBe(true);

      await act(async () => {
        load.resolve();
        await load.promise;
      });
    });

    it('does not leave the spinner latched on when a store refresh follows a pull', async () => {
      const { loaders, recipeListStore } = mount('drafts');
      const load = makeDeferred<void>();
      loaders.loadDrafts.mockReturnValueOnce(load.promise);

      act(() => {
        vm.onRefresh();
      });
      await act(async () => {
        load.resolve();
        await load.promise;
      });
      expect(vm.isRefreshing).toBe(false);

      const beforeStoreRefresh = renders.length;
      act(() => {
        recipeListStore.setState({ state: { status: 'loaded', recipes: [], isRefreshing: true } });
      });

      expect(rendersSince(beforeStoreRefresh).every((r) => !r.isRefreshing)).toBe(true);
    });
  });

  describe('the spinner always clears', () => {
    it('clears isRefreshing when the drafts load rejects, and leaks no unhandled rejection', async () => {
      const { loaders } = mount('drafts');
      loaders.loadDrafts.mockRejectedValueOnce(new Error('boom'));

      // `onRefresh` fires from a `void`ed async IIFE, so a rejection can only
      // surface process-wide. The listener IS the assertion: without the `catch`
      // in `onRefresh` this fires, and registering it also keeps Node from
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

        expect(vm.isRefreshing).toBe(false);
        expect(unhandled).not.toHaveBeenCalled();
      } finally {
        process.off('unhandledRejection', unhandled);
      }
    });

    it('clears isRefreshing when the favorites load rejects on the saved tab', async () => {
      const { loaders } = mount('saved');
      loaders.loadFavorites.mockRejectedValueOnce(new Error('boom'));

      const unhandled = jest.fn();
      process.on('unhandledRejection', unhandled);

      try {
        await act(async () => {
          vm.onRefresh();
          await new Promise((resolve) => setImmediate(resolve));
        });

        // A stuck spinner is the failure mode the `finally` guards.
        expect(vm.isRefreshing).toBe(false);
        expect(unhandled).not.toHaveBeenCalled();
      } finally {
        process.off('unhandledRejection', unhandled);
      }
    });

    it('clears isRefreshing when the favorites load settles into a failure', async () => {
      const { loaders } = mount('saved');
      loaders.loadFavorites.mockResolvedValueOnce(fail(new NetworkFailure('offline')));

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      expect(vm.isRefreshing).toBe(false);
    });
  });

  describe('failure surfacing', () => {
    it('shows an error toast and keeps the saved ids untouched when loading favorites fails', async () => {
      const { loaders } = mount('saved');
      const failure = new NetworkFailure('offline');
      loaders.loadFavorites.mockResolvedValueOnce(fail(failure));

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      expect(showErrorToastMock).toHaveBeenCalledWith(failure);
      // A failed load must not clobber the grid with an empty set.
      expect(loaders.setSavedIds).not.toHaveBeenCalled();
    });

    it('shows no toast when the favorites load succeeds', async () => {
      const { loaders } = mount('saved');
      loaders.loadFavorites.mockResolvedValueOnce(ok(new Set(['r1'])));

      await act(async () => {
        vm.onRefresh();
        await Promise.resolve();
      });

      expect(showErrorToastMock).not.toHaveBeenCalled();
    });
  });
});
