import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { ShoppingItemChanges } from '@domain/shopping/items/shopping-item-changes';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';

/** The viewer's shopping list (`/me/shopping-list`). Unchecked lines come first, then checked. */
export interface ShoppingListRepositoryInterface {
  list(page: number, pageSize: number): Promise<Result<Page<ShoppingItemEntity>, Failure>>;
  /** 1–`ShoppingLimits.batchMax` lines; the same label and unit merge into an unchecked line. */
  add(drafts: readonly ShoppingItemDraft[]): Promise<Result<ShoppingAddResult, Failure>>;
  update(id: string, changes: ShoppingItemChanges): Promise<Result<ShoppingItemEntity, Failure>>;
  remove(id: string): Promise<Result<void, Failure>>;
  /** Deletes every checked line; answers how many went. */
  removeChecked(): Promise<Result<number, Failure>>;
  /** Deletes every line; answers how many went. */
  removeAll(): Promise<Result<number, Failure>>;
}
