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

  it('stops waiting when the load it is waiting for fails', async () => {
    const feed = fakeStore({ status: 'loading' });
    const waiting = waitForRecipeListQuery(feed.store, 'baklava');

    feed.move({ status: 'loaded', query: 'önceki', recipes: [], refreshFailure: {} });

    await expect(waiting).resolves.toBeUndefined();
  });

  // A failure left over from an earlier load says nothing about the query the
  // caller has just asked for; ending the wait on it would answer from the old
  // screen again, which is the whole failure this helper exists to end.
  it('still waits when the failure on hand belongs to an earlier load', async () => {
    jest.useFakeTimers();
    try {
      const feed = fakeStore({ status: 'loaded', query: 'önceki', recipes: [], refreshFailure: {} });
      let settled = false;
      const waiting = waitForRecipeListQuery(feed.store, 'baklava').then(() => (settled = true));

      await jest.advanceTimersByTimeAsync(100);
      expect(settled).toBe(false);

      feed.move({ status: 'loaded', query: 'baklava', recipes: [] });
      await waiting;
      expect(settled).toBe(true);
    } finally {
      jest.useRealTimers();
    }
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
