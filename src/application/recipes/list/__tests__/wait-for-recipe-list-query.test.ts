import { waitForRecipeListQuery } from '@application/recipes/list/wait-for-recipe-list-query';
import type { BoundStore } from '@application/store/bound-store';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';

/** A feed whose state the test moves by hand. */
function fakeStore(initial: unknown) {
  let state = initial;
  const listeners = new Set<(next: { state: unknown }) => void>();
  const store = {
    getState: () => ({ state }),
    subscribe: (listener: (next: { state: unknown }) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    store: store as unknown as BoundStore<RecipeListStoreState>,
    move: (next: unknown) => {
      state = next;
      for (const listener of listeners) listener({ state });
    },
    get listenerCount(): number {
      return listeners.size;
    },
  };
}

describe('waitForRecipeListQuery', () => {
  it('is already over when the rows on hand answer the query', async () => {
    const feed = fakeStore({ status: 'loaded', query: 'baklava', recipes: [] });

    await expect(waitForRecipeListQuery(feed.store, ' baklava ')).resolves.toBeUndefined();
    expect(feed.listenerCount).toBe(0);
  });

  it('waits for the rows, then lets go of the store', async () => {
    const feed = fakeStore({ status: 'loading' });

    const waiting = waitForRecipeListQuery(feed.store, 'baklava');
    feed.move({ status: 'loaded', query: 'baklava', recipes: [] });

    await expect(waiting).resolves.toBeUndefined();
    expect(feed.listenerCount).toBe(0);
  });

  it('does not wait for rows that are never coming', async () => {
    const failed = fakeStore({ status: 'error', failure: {} });
    // A refresh that failed keeps the old query beside the failure.
    const refreshFailed = fakeStore({ status: 'loaded', query: 'önceki', recipes: [], refreshFailure: {} });

    await expect(waitForRecipeListQuery(failed.store, 'baklava')).resolves.toBeUndefined();
    await expect(waitForRecipeListQuery(refreshFailed.store, 'baklava')).resolves.toBeUndefined();
  });

  it('gives up rather than waiting forever', async () => {
    jest.useFakeTimers();
    try {
      const feed = fakeStore({ status: 'loading' });

      const waiting = waitForRecipeListQuery(feed.store, 'baklava');
      await jest.advanceTimersByTimeAsync(4_000);

      await expect(waiting).resolves.toBeUndefined();
      expect(feed.listenerCount).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
