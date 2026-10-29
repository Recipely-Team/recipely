import { NetworkFailure, NotFoundFailure, TimeoutFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { loadedItems } from '@application/store/paging/loaded-items';
import { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';
import { FlushShoppingOutboxUseCase } from '@application/shopping/sync/flush-shopping-outbox-use-case';
import {
  fakeShoppingRepository,
  memoryShoppingOutbox,
  shoppingItemOf,
  shoppingStoreOf,
} from '@application/shopping/__fixtures__/shopping-fixtures';

const page = (items: ReturnType<typeof shoppingItemOf>[]) => ok({ items, total: items.length, page: 1, pageSize: 20, hasMore: false });
const lines = () => [shoppingItemOf({ id: 'a', position: 0 }), shoppingItemOf({ id: 'b', position: 1 })];
const ids = (store: ReturnType<typeof shoppingStoreOf>): string[] =>
  loadedItems(store.getState().list).map((i) => `${i.id}${i.checked ? '+' : ''}`);
const check = (itemId: string, isChecked: boolean) => ({ kind: ShoppingPendingWriteKind.Check, itemId, isChecked }) as const;
const remove = (itemId: string) => ({ kind: ShoppingPendingWriteKind.Delete, itemId }) as const;

/**
 * In a supermarket with no signal, a tick used to spring back with an error and a
 * delete reappeared. A change the API never received now stays on screen and is
 * sent once the API answers again.
 */
describe('Shopping list offline outbox', () => {
  const setup = async () => {
    const repo = fakeShoppingRepository();
    repo.list.mockResolvedValue(page(lines()));
    const outbox = memoryShoppingOutbox();
    const store = shoppingStoreOf(repo, outbox.repo);
    await store.getState().load();
    return { repo, outbox, store };
  };

  it('keeps an offline tick on screen, queues it, and sends it when the API is back', async () => {
    const { repo, outbox, store } = await setup();
    repo.update.mockResolvedValueOnce(fail(new NetworkFailure('offline')));

    const result = await store.getState().setChecked(loadedItems(store.getState().list)[0]!, true);

    expect(result.ok).toBe(true);
    expect(ids(store)).toEqual(['b', 'a+']);
    expect(outbox.held().writes).toEqual([check('a', true)]);

    repo.update.mockResolvedValueOnce(ok(shoppingItemOf({ id: 'a', checked: true })));
    await store.getState().syncPending();
    expect(repo.update).toHaveBeenLastCalledWith('a', { checked: true });
    expect(outbox.held().isEmpty()).toBe(true);
  });

  it('keeps an offline delete gone, even on a page read before it was sent', async () => {
    const { repo, outbox, store } = await setup();
    repo.remove.mockResolvedValue(fail(new TimeoutFailure()));

    await store.getState().remove(loadedItems(store.getState().list)[0]!);
    await store.getState().refresh();

    expect(ids(store)).toEqual(['b']);
    expect(store.getState().list).toMatchObject({ total: 1 });
    expect(outbox.held().writes).toEqual([remove('a')]);
  });

  it('re-reads the list when the server refuses a queued change', async () => {
    const { repo, store } = await setup();
    repo.update.mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    await store.getState().setChecked(loadedItems(store.getState().list)[0]!, true);
    repo.list.mockClear();
    repo.update.mockResolvedValueOnce(fail(new ValidationFailure('no')));

    await store.getState().syncPending();

    expect(repo.list).toHaveBeenCalledTimes(1);
    expect(ids(store)).toEqual(['a', 'b']);
  });

  it('drops the waiting changes on sign-out', async () => {
    const { repo, outbox, store } = await setup();
    repo.remove.mockResolvedValue(fail(new NetworkFailure('offline')));
    await store.getState().remove(loadedItems(store.getState().list)[0]!);

    store.getState().clear();
    await Promise.resolve();

    expect(outbox.held().isEmpty()).toBe(true);
  });
});

describe('FlushShoppingOutboxUseCase', () => {
  it('sends oldest first, stops at the first that cannot reach the API, and keeps the rest', async () => {
    const repo = fakeShoppingRepository();
    const outbox = memoryShoppingOutbox(ShoppingOutbox.of([check('a', true), remove('b'), check('c', false)]));
    repo.update.mockResolvedValueOnce(ok(shoppingItemOf({ id: 'a' })));
    repo.remove.mockResolvedValueOnce(fail(new NetworkFailure('gone again')));

    const report = await new FlushShoppingOutboxUseCase(repo, outbox.repo).execute();

    expect(report.ok && report.value.sent).toBe(1);
    expect(outbox.held().writes).toEqual([remove('b'), check('c', false)]);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('counts a delete of a line already gone as sent, and a refusal as refused', async () => {
    const repo = fakeShoppingRepository();
    const outbox = memoryShoppingOutbox(ShoppingOutbox.of([remove('a'), check('b', true)]));
    repo.remove.mockResolvedValueOnce(fail(new NotFoundFailure('gone')));
    repo.update.mockResolvedValueOnce(fail(new ValidationFailure('no')));

    const report = await new FlushShoppingOutboxUseCase(repo, outbox.repo).execute();

    expect(report.ok && [report.value.sent, report.value.refused]).toEqual([1, 1]);
    expect(outbox.held().isEmpty()).toBe(true);
  });
});
