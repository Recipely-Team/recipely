import type { BoundStore } from '@application/store/bound-store';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import { StoreStatus } from '@application/store/store-status';

/**
 * How long the feed may take to answer a query before the caller gives up on
 * waiting for it. Long enough for a cold request on a slow connection, short
 * enough that the assistant is not left silent: it goes on either way, and the
 * only cost of the timeout is a screen line that says less than it could.
 */
const SETTLE_TIMEOUT_MS = 4_000;

/**
 * Resolves once the feed's rows are the answer to `query`.
 *
 * @remarks
 * - **Why anyone waits.** The assistant's `search` opens the feed with the
 *   query and used to return at once; the registry then read the screen before
 *   the rows arrived and told the model `recipes=none`. The model believed it
 *   and said "I could not find it" while the recipe sat on the screen behind
 *   the panel — reported, with the list visible: "tavuk şavurma dedim,
 *   bulamadım dedi, ekranda listede vardı".
 * - **The store already says which query its rows answer.** `Loaded.query` is
 *   the `RecipeFilters.search` the rows came back for, so waiting for it is
 *   exact rather than a guess at a delay.
 * - **It never rejects and never waits forever.** An error state and a timeout
 *   both resolve: the caller's next step is the same either way.
 */
export function waitForRecipeListQuery(store: BoundStore<RecipeListStoreState>, query: string): Promise<void> {
  const wanted = query.trim();
  const hasRows = (state: RecipeListStoreState['state']): boolean =>
    state.status === StoreStatus.Loaded && state.query.trim() === wanted;
  // Only for a load that happens WHILE we wait: a failure left over from an
  // earlier one says nothing about the query we just asked for, and reading it
  // in the first check would end the wait before the screen had even started.
  const gaveUp = (state: RecipeListStoreState['state']): boolean =>
    state.status === StoreStatus.Error ||
    (state.status === StoreStatus.Loaded && state.refreshFailure !== undefined);

  if (hasRows(store.getState().state)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let unsubscribe: (() => void) | null = null;
    const timer = setTimeout(() => {
      unsubscribe?.();
      resolve();
    }, SETTLE_TIMEOUT_MS);

    unsubscribe = store.subscribe(({ state }) => {
      if (!hasRows(state) && !gaveUp(state)) return;
      clearTimeout(timer);
      unsubscribe?.();
      resolve();
    });

    // A load that finished between the check above and the subscription would
    // otherwise wait out the whole timeout.
    if (hasRows(store.getState().state)) {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    }
  });
}
