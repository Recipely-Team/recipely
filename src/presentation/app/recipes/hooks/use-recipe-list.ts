import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Easing, useAnimatedScrollHandler, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { type Href, useFocusEffect, usePathname, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { SORT_TO_FILTER } from '@presentation/app/recipes/model/recipe-sort';
import type { SortKey } from '@presentation/app/recipes/model/sort-key';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useDebouncedValue } from '@presentation/base/hooks/interaction/use-debounced-value';
import { SEARCH_DEBOUNCE_MS } from '@presentation/app/recipes/model/search-debounce';
import { useRefreshFailureToast } from '@presentation/app/recipes/hooks/use-refresh-failure-toast';
import { useGuestGate } from '@presentation/app/recipes/shared/hooks/use-guest-gate';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import type { UiFilters } from '@presentation/app/recipes/model/ui-filters';
import { emptyFilters } from '@presentation/app/recipes/model/ui-filter-defaults';
import * as mutate from '@presentation/app/recipes/model/filter-mutations';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useWebShellState } from '@presentation/base/web-shell/use-web-shell-state';
import { t, useLocale } from '@presentation/i18n';
import { spacing, layoutSizes } from '@presentation/base/theme';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const RECIPE_CARD_MIN_WIDTH = 320;
const GRID_GAP = spacing.lg2;
/** Snap/timing config for the mobile collapsing header band (Material small-top-app-bar feel). */
const HEADER_TIMING = { duration: 220, easing: Easing.out(Easing.cubic) } as const;
/** Cumulative upward scroll (px) before the band is revealed again. */
const REVEAL_THRESHOLD = spacing.sm;

/**
 * Orchestrates the recipe-list screen: data load with locale/focus refetch,
 * filter + sort state (applied and pending), the mobile collapsing-header scroll
 * animation, and guest-gated save/create actions.
 */
export const useRecipeList = (): UseRecipeListResult => {
  const router = useRouter();
  const pathname = usePathname();
  const { recipeListStore, notificationsStore, savedRecipesStore, loadFavoritesUseCase, authStore } = useStores();
  const { isSaved, toggleSave } = useSaveRecipe();
  const userId = authStore((s) => (s.state.status === 'authenticated' ? s.state.session.user.id : null));
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const onGoToSignIn = useCallback(() => {
    closePrompt();
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);
  // Guest-gated navigations: the create-recipe / AI-generate routes are auth-only,
  // so intercept the tap and surface the sign-in prompt instead of letting the
  // auth guard bounce the guest to a bare login screen.
  const onOpenCreate = useCallback(() => requestGate(() => router.push(RoutePaths.createRecipe)), [requestGate, router]);
  const { cuisineLabel } = useTaxonomyLabel();
  const unreadCount = notificationsStore((s) => s.unreadCount);
  const state = recipeListStore((s) => s.state);
  const load = recipeListStore((s) => s.load);
  const { isWebShell, width } = useLayout();
  const { searchQuery: webSearchQuery } = useWebShellState();
  const reduceMotion = useReducedMotion();
  // Subscribe to locale so the screen re-renders (and reloads) on a language switch.
  const language = useLocale();

  const [search, setSearch] = useState(CharConstants.empty);

  // Web takes the query from the shared app-header field, native from the
  // in-header one; from here down only the effective query matters.
  const effectiveSearch = isWebShell ? webSearchQuery : search;
  const trimmedSearch = effectiveSearch.trim();
  // WHY: search is a backend filter (`RecipeFilters.search`), not a local
  // `Array.filter` over the loaded page — the loaded page is only the first
  // slice of the catalogue, so filtering it locally could only ever find a
  // match among recipes already downloaded and silently missed the rest.
  // Debounced so a typing burst is one request, fired when the user pauses.
  const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS);
  const isSearching = trimmedSearch.length > ValueConstants.zero;

  const scrollY = useSharedValue(ValueConstants.zero);
  const headerTranslateY = useSharedValue(ValueConstants.zero);
  const lastScrollY = useSharedValue(ValueConstants.zero);
  const headerHidden = useSharedValue(ValueConstants.zero);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      if (reduceMotion) return;
      const delta = y - lastScrollY.value;
      if (y <= layoutSizes.homeHeaderMax) {
        if (headerHidden.value !== ValueConstants.zero) {
          headerHidden.value = ValueConstants.zero;
          headerTranslateY.value = withTiming(ValueConstants.zero, HEADER_TIMING);
        }
      } else if (delta > ValueConstants.zero && headerHidden.value !== 1) {
        headerHidden.value = 1;
        headerTranslateY.value = withTiming(-layoutSizes.homeHeaderMax, HEADER_TIMING);
      } else if (delta < -REVEAL_THRESHOLD && headerHidden.value !== ValueConstants.zero) {
        headerHidden.value = ValueConstants.zero;
        headerTranslateY.value = withTiming(ValueConstants.zero, HEADER_TIMING);
      }
      lastScrollY.value = y;
    },
    // Snap the band to whichever edge is nearer when scrolling settles.
    onMomentumEnd: () => {
      if (reduceMotion) return;
      const hide = headerTranslateY.value < -layoutSizes.homeHeaderMax / ValueConstants.two;
      headerHidden.value = hide ? 1 : ValueConstants.zero;
      headerTranslateY.value = withTiming(hide ? -layoutSizes.homeHeaderMax : ValueConstants.zero, HEADER_TIMING);
    },
    onEndDrag: () => {
      if (reduceMotion) return;
      const hide = headerTranslateY.value < -layoutSizes.homeHeaderMax / ValueConstants.two;
      headerHidden.value = hide ? 1 : ValueConstants.zero;
      headerTranslateY.value = withTiming(hide ? -layoutSizes.homeHeaderMax : ValueConstants.zero, HEADER_TIMING);
    },
  });

  const gridColumns = useMemo<number>(() => {
    if (!isWebShell) return 1;
    const available = Math.min(width, layoutSizes.webContentMax) - spacing.xl * ValueConstants.two;
    return Math.max(1, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)));
  }, [isWebShell, width]);

  const [sortBy, setSortBy] = useState<SortKey>('popular');
  const [filters, setFilters] = useState<UiFilters>(emptyFilters);
  const [pendingFilters, setPendingFilters] = useState<UiFilters>(emptyFilters);
  const [pendingSort, setPendingSort] = useState<SortKey>('popular');
  const [sheetOpen, setSheetOpen] = useState<'filter' | null>(null);

  // Web home shows a Save bookmark on each card, so the saved set must be populated.
  useEffect(() => {
    if (!isWebShell) return;
    void loadFavoritesUseCase.execute().then((result) => {
      if (result.ok) savedRecipesStore.getState().setSavedIds(result.value);
    });
  }, [isWebShell, loadFavoritesUseCase, savedRecipesStore]);

  // Takes the query as an argument rather than closing over it: this identity
  // is a dependency of the focus/locale effects below, and a callback that
  // changed on every debounced keystroke would make those effects re-fire and
  // issue a second, duplicate request alongside the search one.
  const buildApiFilters = useCallback(
    (f: UiFilters, sort: SortKey, query: string): RecipeFilters => ({
      ...(query.length > ValueConstants.zero ? { search: query } : {}),
      ...(f.cuisines.length > ValueConstants.zero ? { cuisines: f.cuisines } : {}),
      ...(f.categories.length > ValueConstants.zero ? { categories: f.categories } : {}),
      ...(f.difficulties.length > ValueConstants.zero ? { difficulties: f.difficulties } : {}),
      ...(f.maxTime > ValueConstants.zero ? { maxTime: f.maxTime } : {}),
      sort: SORT_TO_FILTER[sort],
    }),
    [],
  );

  // WHY: the initial load must carry the same `sort` the header advertises
  // ('popular' by default). A bare `load()` would fall back to the backend's
  // default order (createdAt desc), so the first paint and the focus refetch
  // would use different orderings — the list visibly reshuffled the first
  // time the user came back from a recipe detail.
  useEffect(() => {
    if (state.status === 'idle') void load(buildApiFilters(filters, sortBy, debouncedSearch));
  }, [state.status, load, buildApiFilters, filters, sortBy, debouncedSearch]);

  // WHY: the store's `isRefreshing` covers every in-place refetch (filter, sort,
  // locale switch, focus), but `RefreshControl.refreshing` must reflect ONLY a
  // user-initiated pull: setting it programmatically on iOS calls
  // `UIRefreshControl.beginRefreshing`, which animates the scroll view down to
  // reveal the spinner and back when cleared — a visible jump on a filter tap.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // Counts the loads that change WHAT the list should contain — a filter, a
  // sort, a search or a language switch. Those are the ones the feed blanks its
  // rows for: keeping the previous results on screen while the next set arrives
  // read as the list loading twice, and (worse) as if the tap had done nothing.
  // A pull-to-refresh and the silent focus refetch deliberately do NOT count:
  // the first has the pull spinner and needs its rows to stay under the finger,
  // the second asks for the same content the user is already looking at.
  const [pendingReloads, setPendingReloads] = useState(ValueConstants.zero);
  const reload = useCallback(
    async (next: RecipeFilters): Promise<void> => {
      setPendingReloads((n) => n + ValueConstants.one);
      try {
        await load(next);
      } finally {
        setPendingReloads((n) => n - ValueConstants.one);
      }
    },
    [load],
  );

  const onRefresh = useCallback(() => {
    setIsPullRefreshing(true);
    void (async () => {
      try {
        await load(buildApiFilters(filters, sortBy, debouncedSearch));
      } catch {
        // `load` folds failures into state and shouldn't reject; swallow anyway so
        // an unexpected throw can't escape as an unhandled rejection.
      } finally {
        // Unconditional clear: never leave the spinner stuck. A late clear after
        // unmount is a harmless no-op, so this needs no mounted-ref guard.
        setIsPullRefreshing(false);
      }
    })();
  }, [load, filters, sortBy, debouncedSearch, buildApiFilters]);

  // Recipe content is localized server-side, so a language switch must re-fetch.
  // Refs keep the latest filters/sort/query without re-running these effects on
  // their change — each of them owns its own refetch trigger below.
  const filtersRef = useRef(filters);
  const sortByRef = useRef(sortBy);
  const searchRef = useRef(debouncedSearch);
  filtersRef.current = filters;
  sortByRef.current = sortBy;
  searchRef.current = debouncedSearch;
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void reload(buildApiFilters(filtersRef.current, sortByRef.current, searchRef.current));
  }, [language, reload, buildApiFilters]);

  // The query settled — fetch the matching page. Skips the mount run because
  // the idle-load effect above already issues the first request; without the
  // guard the screen would fire two identical loads on every cold open.
  const didSearchRef = useRef(false);
  useEffect(() => {
    if (!didSearchRef.current) {
      didSearchRef.current = true;
      return;
    }
    void reload(buildApiFilters(filtersRef.current, sortByRef.current, debouncedSearch));
  }, [debouncedSearch, reload, buildApiFilters]);

  // Re-fetch quietly on focus so new/edited recipes appear; skip the mount focus.
  const didFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!didFocusRef.current) {
        didFocusRef.current = true;
        return;
      }
      void load(buildApiFilters(filtersRef.current, sortByRef.current, searchRef.current));
    }, [load, buildApiFilters]),
  );

  useRefreshFailureToast(state.status === 'loaded' ? state.refreshFailure : undefined);

  const onOpenRecipe = useCallback(
    (id: string) => router.push(RoutePaths.recipeDetail(id) as Href),
    [router],
  );

  const applyAndLoad = useCallback(
    (next: UiFilters): void => {
      setFilters(next);
      setPendingFilters(next);
      void reload(buildApiFilters(next, sortBy, debouncedSearch));
    },
    [reload, buildApiFilters, sortBy, debouncedSearch],
  );

  const onApplyFilters = (): void => {
    // On mobile the sheet owns sort; on web sort is separate so pendingSort mirrors sortBy.
    const nextSort = isWebShell ? sortBy : pendingSort;
    setFilters(pendingFilters);
    setSortBy(nextSort);
    setSheetOpen(null);
    void reload(buildApiFilters(pendingFilters, nextSort, debouncedSearch));
  };

  const onOpenFilter = (): void => {
    setPendingFilters(filters);
    setPendingSort(sortBy);
    setSheetOpen('filter');
  };

  const onResetFilters = (): void => {
    setFilters(emptyFilters);
    setPendingFilters(emptyFilters);
    // Keep the active sort: resetting filters must not silently change ordering.
    void reload(buildApiFilters(emptyFilters, sortBy, debouncedSearch));
  };

  const recipes = useMemo(
    () => (state.status === 'loaded' ? state.recipes : []),
    [state],
  );

  // Covers the whole round trip the user is waiting on, not just the request:
  // the window between a keystroke and the debounce firing is also "results
  // you can see are out of date", and treating it as idle would flash the
  // previous query's results (or an empty state) mid-typing.
  const isRefetching = isRecipeListRefreshing(state) || trimmedSearch !== debouncedSearch;
  const isReloadingResults = pendingReloads > ValueConstants.zero;

  return {
    state,
    recipes,
    isWebShell,
    isSearching,
    isRefetching,
    isReloadingResults,
    activeFilterCount: mutate.countActiveFilters(filters),
    gridColumns,
    sortBy,
    filters,
    activeCuisineLabel: filters.cuisines.length > ValueConstants.zero ? cuisineLabel(filters.cuisines[ValueConstants.zero]).name : null,
    unreadCount,
    scrollY,
    headerTranslateY,
    reduceMotion,
    scrollHandler,
    search,
    onSearchChange: setSearch,
    isPullRefreshing,
    onRefresh,
    onOpenRecipe,
    onOpenCreate,
    onNotifications: () => router.push(RoutePaths.notifications),
    isSaved,
    onToggleSave: (id: string) => requestGate(() => void toggleSave(id), t().recipes.signInToSave),
    onChangeSort: (key: SortKey) => {
      setSortBy(key);
      void load(buildApiFilters(filters, key, debouncedSearch));
    },
    onToggleCuisineQuick: (cuisine: string) => applyAndLoad(mutate.toggleCuisineQuick(filters, cuisine)),
    onDifficultyChange: (d: Difficulty | null) => applyAndLoad(mutate.setDifficultyQuick(filters, d)),
    onRemoveCategory: (c: string) => applyAndLoad(mutate.removeCategory(filters, c)),
    onRemoveDifficulty: (d: Difficulty) => applyAndLoad(mutate.removeDifficulty(filters, d)),
    onRemoveMaxTime: () => applyAndLoad(mutate.removeMaxTime(filters)),
    onResetFilters,
    sheetOpen,
    pendingFilters,
    pendingSort,
    onOpenFilter,
    onCloseSheet: () => setSheetOpen(null),
    onSelectPendingSort: setPendingSort,
    onTogglePendingCuisine: (c: string) => setPendingFilters((f) => mutate.toggleCuisine(f, c)),
    onTogglePendingCategory: (c: string) => setPendingFilters((f) => mutate.toggleCategory(f, c)),
    onTogglePendingDifficulty: (d: Difficulty) => setPendingFilters((f) => mutate.toggleDifficulty(f, d)),
    onSetPendingMaxTime: (m: number) => setPendingFilters((f) => mutate.setMaxTime(f, m)),
    onApplyFilters,
    promptVisible,
    promptMessage,
    onClosePrompt: closePrompt,
    onGoToSignIn,
  };
};
