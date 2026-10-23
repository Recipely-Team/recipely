import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLocale } from '@presentation/i18n';
import { useSignedInUserId } from '@presentation/base/hooks/auth/use-signed-in-user-id';
import { useLatestRef } from '@presentation/base/hooks/lifecycle/use-latest-ref';
import { useIsScreenFocused } from '@presentation/base/hooks/assistant/use-is-screen-focused';
import { FEED_STALE_AFTER_MS } from '@presentation/app/recipes/model/feed-stale-after-ms';
import { toRecipeFilters } from '@presentation/app/recipes/model/filtering/to-recipe-filters';
import { useRefreshFailureToast } from '@presentation/app/recipes/hooks/use-refresh-failure-toast';
import type { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { ValueConstants } from '@core/constants';

/** What the feed is asking for right now. */
interface FeedQuery {
  filters: UiFilters;
  sortBy: SortKey;
  debouncedSearch: string;
}

/**
 * When the feed loads, and when it loads again.
 *
 * @remarks
 * - **Initial load carries the sort** — a bare `load()` falls back to the
 *   backend's `createdAt desc`, so the first paint and the focus refetch
 *   disagreed and the list reshuffled on the first return from a detail page.
 * - **Refocus refetches only a stale feed** — one older than
 *   `FEED_STALE_AFTER_MS` since its last successful load. Every return from a
 *   detail page used to re-request page 1. A change to the user's own recipes
 *   (publish, create) or a different viewer (sign-in, sign-out) makes the next
 *   focus refetch at once: the rows carry the viewer's liked and saved state.
 * - **A language switch and a new query reload**; both skip their mount run,
 *   which the idle load has already covered.
 * - **Pull-to-refresh** — `isPullRefreshing` tracks ONLY a user-initiated pull.
 *   Setting `RefreshControl.refreshing` programmatically calls
 *   `beginRefreshing` on iOS, which animates the list down and back: a visible
 *   jump on a filter tap.
 * - **`isReloading`** counts the reloads that replace what the list contains
 *   (filter, sort, search, language), so the feed can blank while they run.
 */
export const useFeedLoader = ({ filters, sortBy, debouncedSearch }: FeedQuery) => {
  const { recipeListStore, myRecipesStore } = useStores();
  const userId = useSignedInUserId();
  const language = useLocale();
  const state = useStore(recipeListStore, (s) => s.state);
  const loadFromStore = useStore(recipeListStore, (s) => s.load);
  const loadMore = useStore(recipeListStore, (s) => s.loadMore);

  // When the feed last loaded successfully, and for whom: what the focus refetch's staleness reads.
  const lastLoadedAtRef = useRef<number | null>(null);
  const userIdRef = useLatestRef(userId);
  const loadedForRef = useRef<string | null>(null);
  const load = useCallback(
    async (next: RecipeFilters): Promise<void> => {
      const loadingFor = userIdRef.current;
      await loadFromStore(next);
      const settled = recipeListStore.getState().state;
      if (settled.status === StoreStatus.Loaded && settled.refreshFailure === undefined) {
        lastLoadedAtRef.current = Date.now();
        loadedForRef.current = loadingFor;
      }
    },
    [loadFromStore, recipeListStore, userIdRef],
  );

  useEffect(() => {
    if (state.status === StoreStatus.Idle) void load(toRecipeFilters(filters, sortBy, debouncedSearch));
  }, [state.status, load, filters, sortBy, debouncedSearch]);

  const [pendingReloads, setPendingReloads] = useState(ValueConstants.zero);
  const reload = useCallback(
    async (next: RecipeFilters): Promise<void> => {
      setPendingReloads((n) => n + ValueConstants.one);
      await load(next).finally(() => setPendingReloads((n) => n - ValueConstants.one));
    },
    [load],
  );

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const onRefresh = (): void => {
    setIsPullRefreshing(true);
    // `load` folds failures into state; swallow anyway, and clear the spinner whatever happens.
    void load(toRecipeFilters(filters, sortBy, debouncedSearch))
      .catch(() => undefined)
      .finally(() => setIsPullRefreshing(false));
  };

  // Effect Events, so these effects read the latest filters without re-running on them.
  const reloadCurrent = useEffectEvent(() => {
    void reload(toRecipeFilters(filters, sortBy, debouncedSearch));
  });
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    reloadCurrent();
  }, [language]);
  const didSearchRef = useRef(false);
  useEffect(() => {
    if (!didSearchRef.current) {
      didSearchRef.current = true;
      return;
    }
    reloadCurrent();
  }, [debouncedSearch]);

  const ownRecipesChangedRef = useRef(false);
  useEffect(
    () =>
      // The Created list, not the authoring store: a generation's progress is not a change to my recipes.
      myRecipesStore.subscribe(() => {
        ownRecipesChangedRef.current = true;
      }),
    [myRecipesStore],
  );
  // Focus as state, not useFocusEffect: the refetch is an Effect Event, which runs only inside an effect.
  const isFocused = useIsScreenFocused();
  const didFocusRef = useRef(false);
  const refetchIfStale = useEffectEvent(() => {
    const lastLoadedAt = lastLoadedAtRef.current;
    const isFresh = lastLoadedAt !== null && Date.now() - lastLoadedAt < FEED_STALE_AFTER_MS;
    const isSameViewer = loadedForRef.current === userId;
    if (isFresh && isSameViewer && !ownRecipesChangedRef.current) return;
    ownRecipesChangedRef.current = false;
    void load(toRecipeFilters(filters, sortBy, debouncedSearch));
  });
  useEffect(() => {
    if (!isFocused) return;
    if (!didFocusRef.current) {
      didFocusRef.current = true;
      return;
    }
    refetchIfStale();
  }, [isFocused]);

  useRefreshFailureToast(state.status === StoreStatus.Loaded ? state.refreshFailure : undefined);

  return { state, load, reload, loadMore, onRefresh, isPullRefreshing, isReloading: pendingReloads > ValueConstants.zero };
};
