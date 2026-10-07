import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemEdit } from '@application/shopping/write/shopping-item-edit';

/** The edit sheet's state, as `useShoppingItemEditor` exposes it. */
export interface UseShoppingItemEditorResult {
  /** The line being edited; null while the sheet is closed. */
  editing: ShoppingItemEntity | null;
  fields: ShoppingItemEdit;
  onChange: (fields: ShoppingItemEdit) => void;
  /** Why the last save was refused, as the user reads it; null when nothing was. */
  error: string | null;
  isSaving: boolean;
  open: (item: ShoppingItemEntity) => void;
  close: () => void;
  save: () => void;
}
