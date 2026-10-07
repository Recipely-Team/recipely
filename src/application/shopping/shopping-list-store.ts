import { create } from 'zustand';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import { orderedShoppingItems } from '@domain/shopping/items/ordered-shopping-items';
import { compareShoppingItems } from '@domain/shopping/items/compare-shopping-items';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { KeyedRequestEpoch } from '@application/store/keyed-request-epoch';
import { RequestEpoch } from '@application/store/request-epoch';
import { PageSizes } from '@application/config/page-sizes';
import type { PagedList } from '@application/store/paging/paged-list';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import type { ShoppingListStoreState } from '@application/shopping/shopping-list-store-state';
import type { ListShoppingItemsUseCase } from '@application/shopping/read/list-shopping-items-use-case';
import type { AddShoppingItemUseCase } from '@application/shopping/write/add-shopping-item-use-case';
import type { AddRecipeIngredientsUseCase } from '@application/shopping/write/add-recipe-ingredients-use-case';
import type { UpdateShoppingItemUseCase } from '@application/shopping/write/update-shopping-item-use-case';
import type { SetShoppingItemCheckedUseCase } from '@application/shopping/write/set-shopping-item-checked-use-case';
import type { DeleteShoppingItemUseCase } from '@application/shopping/write/delete-shopping-item-use-case';
import type { ClearCheckedShoppingItemsUseCase } from '@application/shopping/write/clear-checked-shopping-items-use-case';
import type { ClearShoppingListUseCase } from '@application/shopping/write/clear-shopping-list-use-case';

interface ShoppingListStoreDeps {
  list: ListShoppingItemsUseCase;
  addText: AddShoppingItemUseCase;
  addFromRecipe: AddRecipeIngredientsUseCase;
  edit: UpdateShoppingItemUseCase;
  setChecked: SetShoppingItemCheckedUseCase;
  remove: DeleteShoppingItemUseCase;
  clearChecked: ClearCheckedShoppingItemsUseCase;
  clearAll: ClearShoppingListUseCase;
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
 * - **User-scoped**: cleared on sign-out (`clearSessionCaches`); an answer that
 *   lands after that is dropped, so the old account's lines never come back.
 */
export const configureShoppingListStore = (deps: ShoppingListStoreDeps): BoundStore<ShoppingListStoreState> => {
  const ticks = new Map<string, number>();
  const removals = new KeyedRequestEpoch();
  const session = new RequestEpoch();

  return create<ShoppingListStoreState>((set, get) => {
    const loader = new PagedListLoader<ShoppingItemEntity>(() => get().list, (list) => set({ list }), (item) => item.id);
    const fetchPage = (page: number) => deps.list.execute(page, PageSizes.shoppingList);
    const hasMore = (): boolean => { const list = get().list; return list.status === StoreStatus.Loaded && list.hasMore; };
    const place = (touched: Items, totalDelta?: number): void => loader.rewriteItems((items) => placed(items, touched, hasMore()), totalDelta);
    /** Refreshes a line already on screen; one that has left the window stays with its page. */
    const show = (item: ShoppingItemEntity): void => { if (hasItem(get().list, item.id)) place([item]); };
    const added = (result: Result<ShoppingAddResult, Failure>, isSession: () => boolean): Result<ShoppingAddResult, Failure> => {
      if (result.ok && isSession()) place(result.value.items, result.value.added);
      return result;
    };

    return {
      list: { status: StoreStatus.Idle },
      isRefreshing: false,
      load: () => loader.load(fetchPage),
      loadMore: () => loader.loadMore(),
      refresh: async () => {
        set({ isRefreshing: true });
        const failure = await loader.refresh(fetchPage);
        set({ isRefreshing: false });
        return failure;
      },
      addText: async (text) => { const isSession = session.current(); return added(await deps.addText.execute(text), isSession); },
      addFromRecipe: async (lines, recipe) => { const isSession = session.current(); return added(await deps.addFromRecipe.execute(lines, recipe), isSession); },

      setChecked: async (item, checked) => {
        const tick = (ticks.get(item.id) ?? ValueConstants.zero) + ValueConstants.one;
        ticks.set(item.id, tick);
        const isSession = session.current();
        const wasShown = hasItem(get().list, item.id);
        if (wasShown) place([item.withChecked(checked)]);
        const result = await deps.setChecked.execute(item.id, checked);
        if (ticks.get(item.id) !== tick || !isSession()) return ok(undefined);
        if (result.ok) show(result.value);
        else if (wasShown) place([item]);
        return result.ok ? ok(undefined) : result;
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
        // Back only if this session's list still lacks it: a refresh may already have brought it back.
        if (!result.ok && wasShown && isCurrent() && !hasItem(get().list, item.id)) place([item], ValueConstants.one);
        return result;
      },

      clearChecked: async () => {
        const result = await deps.clearChecked.execute();
        if (result.ok) loader.rewriteItems((items) => items.filter((item) => !item.checked), -result.value);
        return result;
      },

      clearAll: async () => {
        const result = await deps.clearAll.execute();
        if (result.ok) set((s) => ({ list: s.list.status === StoreStatus.Loaded ? { ...s.list, items: [], total: ValueConstants.zero, hasMore: false } : s.list }));
        return result;
      },

      clear: () => {
        removals.invalidate();
        session.invalidate();
        ticks.clear();
        loader.reset();
        set({ isRefreshing: false });
      },
    };
  });
};
