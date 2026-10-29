import { createStore } from 'zustand/vanilla';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import { orderedShoppingItems } from '@domain/shopping/items/ordered-shopping-items';
import { compareShoppingItems } from '@domain/shopping/items/compare-shopping-items';
import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import { KeyedRequestEpoch } from '@application/store/keyed-request-epoch';
import { RequestEpoch } from '@application/store/request-epoch';
import { PageSizes } from '@application/config/page-sizes';
import type { PagedList } from '@application/store/paging/paged-list';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { ShoppingListStore } from '@application/shopping/shopping-list-store-contract';
import type { ListShoppingItemsUseCase } from '@application/shopping/read/list-shopping-items-use-case';
import type { AddShoppingItemUseCase } from '@application/shopping/write/add-shopping-item-use-case';
import type { AddRecipeIngredientsUseCase } from '@application/shopping/write/add-recipe-ingredients-use-case';
import type { AddShoppingDraftsUseCase } from '@application/shopping/write/add-shopping-drafts-use-case';
import type { UpdateShoppingItemUseCase } from '@application/shopping/write/update-shopping-item-use-case';
import type { SetShoppingItemCheckedUseCase } from '@application/shopping/write/set-shopping-item-checked-use-case';
import type { DeleteShoppingItemUseCase } from '@application/shopping/write/delete-shopping-item-use-case';
import type { ClearCheckedShoppingItemsUseCase } from '@application/shopping/write/clear-checked-shopping-items-use-case';
import type { ClearShoppingListUseCase } from '@application/shopping/write/clear-shopping-list-use-case';
import type { CountShoppingToBuyUseCase } from '@application/shopping/read/count-shopping-to-buy-use-case';
import type { QueueShoppingWriteUseCase } from '@application/shopping/sync/queue-shopping-write-use-case';
import type { LoadShoppingOutboxUseCase } from '@application/shopping/sync/load-shopping-outbox-use-case';
import type { FlushShoppingOutboxUseCase } from '@application/shopping/sync/flush-shopping-outbox-use-case';
import type { ClearShoppingOutboxUseCase } from '@application/shopping/sync/clear-shopping-outbox-use-case';
import { isOfflineFailure } from '@application/shopping/sync/is-offline-failure';
import { applyPendingShoppingWrites } from '@application/shopping/sync/apply-pending-shopping-writes';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';

interface ShoppingListStoreDeps {
  list: ListShoppingItemsUseCase;
  addText: AddShoppingItemUseCase;
  addFromRecipe: AddRecipeIngredientsUseCase;
  addDrafts: AddShoppingDraftsUseCase;
  edit: UpdateShoppingItemUseCase;
  setChecked: SetShoppingItemCheckedUseCase;
  remove: DeleteShoppingItemUseCase;
  clearChecked: ClearCheckedShoppingItemsUseCase;
  clearAll: ClearShoppingListUseCase;
  countToBuy: CountShoppingToBuyUseCase;
  queueWrite: QueueShoppingWriteUseCase;
  loadOutbox: LoadShoppingOutboxUseCase;
  flushOutbox: FlushShoppingOutboxUseCase;
  clearOutbox: ClearShoppingOutboxUseCase;
}

type Items = readonly ShoppingItemEntity[];

/**
 * The loaded window with `touched` lines put in their server places. While more
 * pages exist, a touched line that now sorts past the window's last row belongs
 * to a later page and is left for it, so the window stays a prefix of the list.
 */
const placed = (items: Items, touched: Items, hasMore: boolean): Items => {
  const ids = new Set(touched.map((item) => item.id));
  const last = items[items.length - ValueConstants.one];
  const kept = !hasMore ? touched : last === undefined ? [] : touched.filter((item) => compareShoppingItems(item, last) <= ValueConstants.zero);
  return orderedShoppingItems([...items.filter((item) => !ids.has(item.id)), ...kept]);
};

const hasItem = (list: PagedList<ShoppingItemEntity>, id: string): boolean =>
  list.status === StoreStatus.Loaded && list.items.some((item) => item.id === id);

/**
 * The viewer's shopping list, paged on scroll through a `PagedListLoader`.
 *
 * @remarks
 * - **Ticks are optimistic.** A tick shows at once; a refusal puts the old one
 *   back — unless a later tick of the same line is on its way, whose answer
 *   then decides. A delete is optimistic too and puts the line back on refusal.
 * - **Adds show without a reload**: the lines the server touched replace
 *   theirs or join in their place; the total grows by what was new, not by merges.
 * - **The window stays a prefix of the server's order** (unchecked, then
 *   checked, by position): a line ticked, added or put back past the last
 *   loaded row waits for its page, and every row that leaves goes through the
 *   loader, so the next page re-reads from the shifted offset instead of skipping.
 * - **`toBuy` is the server's count** (the cart badge): the list is paged, so
 *   it is never counted from loaded rows; every successful change re-reads it.
 * - **Offline ticks and deletes are kept, not undone.** When the API cannot be
 *   reached, the change stays on screen and waits in the outbox (only changes
 *   safe to send twice are queued — Google AIP-194); `syncPending` sends it, and
 *   runs after every load, refresh and accepted change. A loaded page shows the
 *   waiting changes over it; a change the server then refuses re-reads the list.
 * - **User-scoped**: cleared on sign-out (`clearSessionCaches`), outbox included;
 *   an answer that lands after that is dropped, so the old account's lines never come back.
 */
export const configureShoppingListStore = (deps: ShoppingListStoreDeps): StoreApi<ShoppingListStore> => {
  const ticks = new Map<string, number>();
  const removals = new KeyedRequestEpoch();
  const session = new RequestEpoch();
  const toBuyReads = new RequestEpoch();
  let flushing: Promise<void> | null = null;

  return createStore<ShoppingListStore>((set, get) => {
    const loader = new PagedListLoader<ShoppingItemEntity>(() => get().list, (list) => set({ list }), (item) => item.id);
    const fetchPage = (page: number) => deps.list.execute(page, PageSizes.shoppingList);
    const hasMore = (): boolean => { const list = get().list; return list.status === StoreStatus.Loaded && list.hasMore; };
    const place = (touched: Items, totalDelta?: number): void => loader.rewriteItems((items) => placed(items, touched, hasMore()), totalDelta);
    /** Refreshes a line already on screen; one that has left the window stays with its page. */
    const show = (item: ShoppingItemEntity): void => { if (hasItem(get().list, item.id)) place([item]); };
    const loadToBuy = async (): Promise<void> => {
      const isCurrent = toBuyReads.start();
      const isSession = session.current();
      const result = await deps.countToBuy.execute();
      if (result.ok && isCurrent() && isSession()) set({ toBuy: result.value });
    };
    /** After a change the server accepted, the badge re-reads its count. */
    const synced = <T,>(result: Result<T, Failure>): Result<T, Failure> => {
      if (result.ok) void loadToBuy();
      return result;
    };
    /** Shows the waiting changes over the page just loaded, then tries to send them. */
    const withPending = async (isSession: () => boolean): Promise<void> => {
      const outbox = await deps.loadOutbox.execute();
      if (!outbox.ok || outbox.value.isEmpty() || !isSession()) return;
      const list = get().list;
      if (list.status !== StoreStatus.Loaded) return;
      const applied = applyPendingShoppingWrites(list.items, outbox.value);
      loader.rewriteItems(() => orderedShoppingItems([...applied.items]), -applied.removed);
      void get().syncPending();
    };
    const added = (result: Result<ShoppingAddResult, Failure>, isSession: () => boolean): Result<ShoppingAddResult, Failure> => {
      if (result.ok && isSession()) place(result.value.items, result.value.added);
      return synced(result);
    };

    return {
      list: { status: StoreStatus.Idle },
      toBuy: null,
      loadToBuy,
      isRefreshing: false,
      load: async () => {
        const isSession = session.current();
        await loader.load(fetchPage);
        await withPending(isSession);
      },
      loadMore: () => loader.loadMore(),
      refresh: async () => {
        const isSession = session.current();
        set({ isRefreshing: true });
        const failure = await loader.refresh(fetchPage);
        set({ isRefreshing: false });
        await withPending(isSession);
        return failure;
      },
      syncPending: () => {
        flushing ??= (async () => {
          const isSession = session.current();
          const report = await deps.flushOutbox.execute();
          if (!report.ok || !isSession()) return;
          if (report.value.refused > ValueConstants.zero) await loader.refresh(fetchPage);
          if (report.value.sent + report.value.refused > ValueConstants.zero) void loadToBuy();
        })().finally(() => {
          flushing = null;
        });
        return flushing;
      },
      addText: async (text) => { const isSession = session.current(); return added(await deps.addText.execute(text), isSession); },
      addFromRecipe: async (lines, recipe) => { const isSession = session.current(); return added(await deps.addFromRecipe.execute(lines, recipe), isSession); },
      addDrafts: async (drafts) => { const isSession = session.current(); return added(await deps.addDrafts.execute(drafts), isSession); },

      setChecked: async (item, isChecked) => {
        const tick = (ticks.get(item.id) ?? ValueConstants.zero) + ValueConstants.one;
        ticks.set(item.id, tick);
        const isSession = session.current();
        const wasShown = hasItem(get().list, item.id);
        if (wasShown) place([item.withChecked(isChecked)]);
        const result = await deps.setChecked.execute(item.id, isChecked);
        if (ticks.get(item.id) !== tick || !isSession()) return ok(undefined);
        if (!result.ok && isOfflineFailure(result.failure)) {
          const queued = await deps.queueWrite.execute({ kind: ShoppingPendingWriteKind.Check, itemId: item.id, isChecked });
          if (queued.ok) return ok(undefined);
        }
        if (result.ok) {
          show(result.value);
          void get().syncPending();
        }
        else if (wasShown) place([item]);
        return synced(result.ok ? ok(undefined) : result);
      },

      edit: async (id, edit) => {
        const isSession = session.current();
        const result = await deps.edit.execute(id, edit);
        if (result.ok && isSession()) show(result.value);
        return result;
      },

      remove: async (item) => {
        const isCurrent = removals.start(item.id);
        const wasShown = hasItem(get().list, item.id);
        loader.removeItem(item.id);
        const result = await deps.remove.execute(item.id);
        if (!result.ok && isOfflineFailure(result.failure)) {
          const queued = await deps.queueWrite.execute({ kind: ShoppingPendingWriteKind.Delete, itemId: item.id });
          if (queued.ok) return ok(undefined);
        }
        if (result.ok) void get().syncPending();
        // Back only if this session's list still lacks it: a refresh may already have brought it back.
        if (!result.ok && wasShown && isCurrent() && !hasItem(get().list, item.id)) place([item], ValueConstants.one);
        return synced(result);
      },

      clearChecked: async () => {
        const result = await deps.clearChecked.execute();
        if (result.ok) loader.rewriteItems((items) => items.filter((item) => !item.checked), -result.value);
        return synced(result);
      },

      clearAll: async () => {
        const result = await deps.clearAll.execute();
        if (result.ok) set((s) => ({ list: s.list.status === StoreStatus.Loaded ? { ...s.list, items: [], total: ValueConstants.zero, hasMore: false } : s.list }));
        return synced(result);
      },

      clear: () => {
        removals.invalidate();
        session.invalidate();
        toBuyReads.invalidate();
        ticks.clear();
        loader.reset();
        void deps.clearOutbox.execute();
        set({ isRefreshing: false, toBuy: null });
      },
    };
  });
};
