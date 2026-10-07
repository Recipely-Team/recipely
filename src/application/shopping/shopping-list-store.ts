import { create } from 'zustand';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import { orderedShoppingItems } from '@domain/shopping/items/ordered-shopping-items';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
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

/** A loaded list with its rows rewritten (and re-ordered) and its total moved; any other list unchanged. */
const rewrite = (list: PagedList<ShoppingItemEntity>, next: (items: Items) => Items, totalDelta = ValueConstants.zero): PagedList<ShoppingItemEntity> =>
  list.status === StoreStatus.Loaded
    ? { ...list, items: orderedShoppingItems(next(list.items)), total: Math.max(ValueConstants.zero, list.total + totalDelta) }
    : list;

const hasItem = (list: PagedList<ShoppingItemEntity>, id: string): boolean =>
  list.status === StoreStatus.Loaded && list.items.some((item) => item.id === id);

/** Touched lines replace theirs by id; new ones go to the top. */
const upserting = (touched: Items) => (items: Items): Items => {
  const byId = new Map(touched.map((item) => [item.id, item]));
  const known = new Set(items.map((item) => item.id));
  return [...touched.filter((item) => !known.has(item.id)), ...items.map((item) => byId.get(item.id) ?? item)];
};

/**
 * The viewer's shopping list, paged on scroll through a `PagedListLoader`.
 *
 * @remarks
 * - **Ticks are optimistic.** A tick shows at once; a refusal puts the old one
 *   back — unless a later tick of the same line is on its way, whose answer
 *   then decides. A delete is optimistic too and puts the line back on refusal.
 * - **Adds show without a reload**: the lines the server touched replace
 *   theirs or join the top; the total grows by what was new, not by merges.
 * - **User-scoped**: cleared on sign-out (`clearSessionCaches`).
 */
export const configureShoppingListStore = (deps: ShoppingListStoreDeps): BoundStore<ShoppingListStoreState> => {
  const ticks = new Map<string, number>();
  let session: number = ValueConstants.zero;

  return create<ShoppingListStoreState>((set, get) => {
    const loader = new PagedListLoader<ShoppingItemEntity>(() => get().list, (list) => set({ list }), (item) => item.id);
    const fetchPage = (page: number) => deps.list.execute(page, PageSizes.shoppingList);
    const update = (next: (items: Items) => Items, totalDelta?: number): void => set((s) => ({ list: rewrite(s.list, next, totalDelta) }));
    const show = (item: ShoppingItemEntity): void => update((items) => items.map((it) => (it.id === item.id ? item : it)));
    const added = (result: Result<ShoppingAddResult, Failure>): Result<ShoppingAddResult, Failure> => {
      if (result.ok) update(upserting(result.value.items), result.value.added);
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
      addText: async (text) => added(await deps.addText.execute(text)),
      addFromRecipe: async (lines, recipe) => added(await deps.addFromRecipe.execute(lines, recipe)),

      setChecked: async (item, checked) => {
        const tick = (ticks.get(item.id) ?? ValueConstants.zero) + ValueConstants.one;
        ticks.set(item.id, tick);
        show(item.withChecked(checked));
        const result = await deps.setChecked.execute(item.id, checked);
        if (ticks.get(item.id) !== tick) return ok(undefined);
        show(result.ok ? result.value : item);
        return result.ok ? ok(undefined) : result;
      },

      edit: async (id, edit) => {
        const result = await deps.edit.execute(id, edit);
        if (result.ok) show(result.value);
        return result;
      },

      remove: async (item) => {
        const sessionAtStart = session;
        const before = get().list;
        const at = before.status === StoreStatus.Loaded ? before.items.findIndex((it) => it.id === item.id) : ValueConstants.minusOne;
        update((items) => items.filter((it) => it.id !== item.id), at < ValueConstants.zero ? ValueConstants.zero : ValueConstants.minusOne);
        const result = await deps.remove.execute(item.id);
        // Back only if this session's list still lacks it: a refresh may already have brought it back.
        if (!result.ok && at >= ValueConstants.zero && session === sessionAtStart && !hasItem(get().list, item.id)) {
          update((items) => [...items.slice(ValueConstants.zero, at), item, ...items.slice(at)], ValueConstants.one);
        }
        return result;
      },

      clearChecked: async () => {
        const result = await deps.clearChecked.execute();
        if (result.ok) update((items) => items.filter((item) => !item.checked), -result.value);
        return result;
      },

      clearAll: async () => {
        const result = await deps.clearAll.execute();
        if (result.ok) set((s) => ({ list: s.list.status === StoreStatus.Loaded ? { ...s.list, items: [], total: ValueConstants.zero, hasMore: false } : s.list }));
        return result;
      },

      clear: () => {
        session += ValueConstants.one;
        ticks.clear();
        loader.reset();
        set({ isRefreshing: false });
      },
    };
  });
};
