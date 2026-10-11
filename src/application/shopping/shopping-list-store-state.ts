import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import type { ShoppingRecipeRef } from '@domain/shopping/recipe/shopping-recipe-ref';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { PagedList } from '@application/store/paging/paged-list';
import type { ShoppingItemEdit } from '@application/shopping/write/shopping-item-edit';

export interface ShoppingListStoreState {
  /** Unchecked lines first, then checked — kept in that order through every local change. */
  list: PagedList<ShoppingItemEntity>;
  /** Lines still to buy, from the server (the list is paged); null until first read or when signed out. */
  toBuy: number | null;
  /** Re-reads `toBuy`. Every successful change re-reads it too. */
  loadToBuy: () => Promise<void>;
  isRefreshing: boolean;
  load: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Pull-to-refresh: the rows stay until page 1 answers; a failure is returned and the rows kept. */
  refresh: () => Promise<Failure | null>;
  /** One typed line; on success the touched line is shown at once. */
  addText: (text: string) => Promise<Result<ShoppingAddResult, Failure>>;
  /** A recipe's ingredient lines as the reader sees them (scaled, converted); `recipe` null for lines of no saved recipe. */
  addFromRecipe: (lines: readonly string[], recipe: ShoppingRecipeRef | null) => Promise<Result<ShoppingAddResult, Failure>>;
  /** Lines already read into label, amount and unit — a planned week's merged ingredients. */
  addDrafts: (drafts: readonly ShoppingItemDraft[]) => Promise<Result<ShoppingAddResult, Failure>>;
  /** Ticks at once; a refusal puts the old tick back unless a later tick of the same line overtook it. */
  setChecked: (item: ShoppingItemEntity, checked: boolean) => Promise<Result<void, Failure>>;
  edit: (id: string, edit: ShoppingItemEdit) => Promise<Result<ShoppingItemEntity, Failure>>;
  /** Removes at once; a refusal puts the line back where it was. */
  remove: (item: ShoppingItemEntity) => Promise<Result<void, Failure>>;
  clearChecked: () => Promise<Result<number, Failure>>;
  clearAll: () => Promise<Result<number, Failure>>;
  /** Drops everything. Called when the session ends. */
  clear: () => void;
}
