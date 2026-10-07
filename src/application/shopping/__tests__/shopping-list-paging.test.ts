import { ok } from '@core/result/result-helpers';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { orderedShoppingItems } from '@domain/shopping/items/ordered-shopping-items';
import { loadedItems } from '@application/store/paging/loaded-items';
import { fakeShoppingRepository, shoppingItemOf, shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';

const LINES = 40;

/**
 * A repository that behaves like the backend: it pages its rows in the server's
 * order (unchecked, then checked, by position), and a delete or a tick really
 * moves the rows after it.
 */
const fakeServer = (checkedPositions: readonly number[] = []) => {
  let rows: ShoppingItemEntity[] = Array.from({ length: LINES }, (_, i) =>
    shoppingItemOf({ id: `l${i}`, position: i, checked: checkedPositions.includes(i) }));
  const repo = fakeShoppingRepository();
  repo.list.mockImplementation(async (page, pageSize) => {
    const ordered = orderedShoppingItems(rows);
    return ok({ items: ordered.slice((page - 1) * pageSize, page * pageSize), total: ordered.length, page, pageSize, hasMore: page * pageSize < ordered.length });
  });
  repo.remove.mockImplementation(async (id) => {
    rows = rows.filter((row) => row.id !== id);
    return ok(undefined);
  });
  repo.update.mockImplementation(async (id, edit) => {
    const row = rows.find((r) => r.id === id)!;
    const next = row.withChecked(edit.checked ?? row.checked);
    rows = rows.map((r) => (r.id === id ? next : r));
    return ok(next);
  });
  return { repo, server: () => orderedShoppingItems(rows).map((row) => row.id) };
};

const scrollToEnd = async (store: ReturnType<typeof shoppingStoreOf>): Promise<void> => {
  for (let i = 0; i < LINES; i += 1) await store.getState().loadMore();
};

/**
 * Review finding: the store rewrote its rows itself and never told the loader,
 * so after a delete or a tick on page 1 the next page asked the old offset while
 * every later server row had moved up — line 21 was never shown.
 */
describe('ShoppingListStore paging after edits', () => {
  it('a line deleted on page 1 does not hide the first line of page 2', async () => {
    const { repo, server } = fakeServer();
    const store = shoppingStoreOf(repo);
    await store.getState().load();
    await store.getState().remove(loadedItems(store.getState().list)[3]!);
    await scrollToEnd(store);

    expect(loadedItems(store.getState().list).map((row) => row.id)).toEqual(server());
  });

  it('a line ticked on page 1 does not hide the first line of page 2, and shows in the server order', async () => {
    const { repo, server } = fakeServer();
    const store = shoppingStoreOf(repo);
    await store.getState().load();
    await store.getState().setChecked(loadedItems(store.getState().list)[3]!, true);
    expect(loadedItems(store.getState().list).map((row) => row.id)).not.toContain('l3');
    await scrollToEnd(store);

    expect(loadedItems(store.getState().list).map((row) => row.id)).toEqual(server());
  });

  it('a line unticked into the loaded unchecked rows shows there at once', async () => {
    const { repo, server } = fakeServer([1, 30]);
    const store = shoppingStoreOf(repo);
    await store.getState().load();
    await store.getState().loadMore();
    const ticked = loadedItems(store.getState().list).find((row) => row.id === 'l30')!;
    await store.getState().setChecked(ticked, false);

    expect(loadedItems(store.getState().list).map((row) => row.id)).toEqual(server());
  });
});
