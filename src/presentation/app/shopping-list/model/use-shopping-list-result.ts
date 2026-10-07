import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { PagedList } from '@application/store/paging/paged-list';
import type { ShoppingRow } from '@presentation/app/shopping-list/model/shopping-row';
import type { ShoppingConfirmType } from '@presentation/app/shopping-list/model/shopping-confirm';

/** The Shopping list screen, as `useShoppingList` exposes it. */
export interface UseShoppingListResult {
  list: PagedList<ShoppingItemEntity>;
  /** Unchecked, then checked, each under its heading; a half with nothing in it is left out. */
  rows: readonly ShoppingRow[];
  /** Every loaded line, unchecked first — the order the user reads them in. */
  items: readonly ShoppingItemEntity[];
  checkedCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onEndReached: () => void;
  onBack: () => void;
  draft: string;
  onChangeDraft: (text: string) => void;
  isAdding: boolean;
  onAdd: () => void;
  onToggle: (item: ShoppingItemEntity) => void;
  onRemove: (item: ShoppingItemEntity) => void;
  confirm: ShoppingConfirmType | null;
  isConfirming: boolean;
  onAskConfirm: (confirm: ShoppingConfirmType) => void;
  onConfirm: () => void;
  onCloseConfirm: () => void;
}
