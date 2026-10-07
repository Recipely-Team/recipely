import { ConflictFailure, type Failure, NetworkFailure, ValidationFailure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { fail, ok } from '@core/result/result-helpers';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { fakeShoppingRepository, shoppingItemOf, shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';

const page = (items: ReturnType<typeof shoppingItemOf>[], total = items.length, n = 1) =>
  ok({ items, total, page: n, pageSize: 20, hasMore: n * 20 < total });

const loaded = async () => {
  const repo = fakeShoppingRepository();
  repo.list.mockResolvedValue(page([shoppingItemOf({ id: 'a', position: 0 }), shoppingItemOf({ id: 'b', position: 1 }), shoppingItemOf({ id: 'c', checked: true, position: 2 })]));
  const store = shoppingStoreOf(repo);
  await store.getState().load();
  return { repo, store };
};
const ids = (store: ReturnType<typeof shoppingStoreOf>): string[] => loadedItems(store.getState().list).map((i) => `${i.id}${i.checked ? '+' : ''}`);

describe('ShoppingListStore', () => {
  it('loads page 1 and the next page on scroll with the shopping page size', async () => {
    const repo = fakeShoppingRepository();
    repo.list.mockResolvedValueOnce(page([shoppingItemOf({ id: 'a' })], 30)).mockResolvedValueOnce(page([shoppingItemOf({ id: 'b' })], 30, 2));
    const store = shoppingStoreOf(repo);
    await store.getState().load();
    await store.getState().loadMore();
    expect(repo.list.mock.calls).toEqual([[1, 20], [2, 20]]);
    expect(ids(store)).toEqual(['a', 'b']);
  });

  it('ticks at once, moves the line below the unchecked ones, and puts the tick back on a refusal', async () => {
    const { repo, store } = await loaded();
    const a = loadedItems(store.getState().list)[0];
    let answer: (r: Result<ShoppingItemEntity, Failure>) => void = () => undefined;
    repo.update.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const pending = store.getState().setChecked(a, true);
    expect(ids(store)).toEqual(['b', 'a+', 'c+']);
    answer(fail(new NetworkFailure('offline')));
    const r = await pending;
    expect(r.ok).toBe(false);
    expect(ids(store)).toEqual(['a', 'b', 'c+']);
  });

  it('lets a later tick of the same line decide when an earlier one fails', async () => {
    const { repo, store } = await loaded();
    const a = loadedItems(store.getState().list)[0];
    repo.update.mockResolvedValueOnce(fail(new NetworkFailure('x'))).mockResolvedValueOnce(ok(a));
    const first = store.getState().setChecked(a, true);
    const second = store.getState().setChecked(a.withChecked(true), false);
    expect((await first).ok).toBe(true);
    await second;
    expect(ids(store)).toEqual(['a', 'b', 'c+']);
  });

  it('removes at once and puts the line back where it was on a refusal', async () => {
    const { repo, store } = await loaded();
    const b = loadedItems(store.getState().list)[1];
    repo.remove.mockResolvedValue(fail(new ConflictFailure('changed')));
    const pending = store.getState().remove(b);
    expect(ids(store)).toEqual(['a', 'c+']);
    await pending;
    expect(ids(store)).toEqual(['a', 'b', 'c+']);
  });

  it('shows added and merged lines without a reload, counting only the new ones', async () => {
    const { repo, store } = await loaded();
    repo.add.mockResolvedValue(ok({ items: [shoppingItemOf({ id: 'n', label: 'Milk', position: -1 }), shoppingItemOf({ id: 'b', quantity: 5, position: 1 })], added: 1, merged: 1 }));
    const r = await store.getState().addFromRecipe(['1 cup milk', '3 cups flour'], { id: 'r1', name: 'Pancakes' });
    expect(r.ok && [r.value.added, r.value.merged]).toEqual([1, 1]);
    expect(ids(store)).toEqual(['n', 'a', 'b', 'c+']);
    const list = store.getState().list;
    expect(list.status === StoreStatus.Loaded && list.total).toBe(4);
    expect(loadedItems(list)[2]?.quantity).toBe(5);
  });

  it('refuses a blank typed line without a request', async () => {
    const { repo, store } = await loaded();
    const r = await store.getState().addText('   ');
    expect(!r.ok && r.failure).toBeInstanceOf(ValidationFailure);
    expect(repo.add).not.toHaveBeenCalled();
  });

  it('clears completed lines, then all of them', async () => {
    const { repo, store } = await loaded();
    repo.removeChecked.mockResolvedValue(ok(1));
    await store.getState().clearChecked();
    expect(ids(store)).toEqual(['a', 'b']);
    repo.removeAll.mockResolvedValue(ok(2));
    await store.getState().clearAll();
    const list = store.getState().list;
    expect(list.status === StoreStatus.Loaded && [list.items.length, list.total]).toEqual([0, 0]);
  });

  it('keeps the rows on a failed pull-to-refresh and returns why', async () => {
    const { repo, store } = await loaded();
    repo.list.mockResolvedValue(fail(new NetworkFailure('offline')));
    const failure = await store.getState().refresh();
    expect(failure).toBeInstanceOf(NetworkFailure);
    expect(ids(store)).toEqual(['a', 'b', 'c+']);
    expect(store.getState().isRefreshing).toBe(false);
  });

  // Review finding: a refresh that failed while the next page was in flight left `isLoadingMore` set, and paging stopped for good.
  it('pages again after a pull-to-refresh fails while the next page is loading', async () => {
    const repo = fakeShoppingRepository();
    repo.list.mockResolvedValueOnce(page([shoppingItemOf({ id: 'a' })], 30));
    const store = shoppingStoreOf(repo);
    await store.getState().load();
    let answerPage2: (value: ReturnType<typeof page>) => void = () => undefined;
    repo.list.mockReturnValueOnce(new Promise((resolve) => { answerPage2 = resolve; }));
    const scrolling = store.getState().loadMore();
    repo.list.mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    await store.getState().refresh();
    answerPage2(page([shoppingItemOf({ id: 'b' })], 30, 2));
    await scrolling;

    repo.list.mockResolvedValueOnce(page([shoppingItemOf({ id: 'b' })], 30, 2));
    await store.getState().loadMore();
    expect(repo.list).toHaveBeenLastCalledWith(2, 20);
  });

  it('does not put a removed line back twice when a refresh already restored it', async () => {
    const { repo, store } = await loaded();
    let answerDelete: (value: Result<void, Failure>) => void = () => undefined;
    repo.remove.mockReturnValueOnce(new Promise((resolve) => { answerDelete = resolve; }));
    const removing = store.getState().remove(loadedItems(store.getState().list)[0]!);
    await store.getState().refresh();
    answerDelete(fail(new NetworkFailure('offline')));
    await removing;
    expect(ids(store)).toEqual(['a', 'b', 'c+']);
  });

  it('forgets the list when the session ends', async () => {
    const { store } = await loaded();
    store.getState().clear();
    expect(store.getState().list.status).toBe(StoreStatus.Idle);
  });
});
