import { useState } from 'react';
import { CharConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { shoppingAmountText } from '@domain/shopping/items/shopping-amount-text';
import type { ShoppingItemEdit } from '@application/shopping/write/shopping-item-edit';
import { useStores } from '@presentation/bootstrap/use-stores';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import type { UseShoppingItemEditorResult } from '@presentation/app/shopping-list/model/use-shopping-item-editor-result';
import { t } from '@presentation/i18n';

const EMPTY: ShoppingItemEdit = { label: CharConstants.empty, quantityText: CharConstants.empty, unit: CharConstants.empty };

/**
 * The edit sheet for one line: its name, amount and unit. Whether the amount
 * reads as a number is the use case's call; a refusal stays in the sheet as
 * the error's own body copy, so the user fixes the field instead of losing it.
 */
export const useShoppingItemEditor = (): UseShoppingItemEditorResult => {
  const { shoppingListStore } = useStores();
  const [editing, setEditing] = useState<ShoppingItemEntity | null>(null);
  const [fields, setFields] = useState<ShoppingItemEdit>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  return {
    editing,
    fields,
    onChange: (next) => {
      setFields(next);
      setError(null);
    },
    error,
    isSaving,
    open: (item) => {
      setEditing(item);
      setError(null);
      setFields({
        label: item.label,
        quantityText: shoppingAmountText(item.quantity, null, t().recipes.portions.decimalMark),
        unit: item.unit ?? CharConstants.empty,
      });
    },
    close: () => setEditing(null),
    save: () => {
      if (editing === null || isSaving) return;
      setSaving(true);
      void shoppingListStore.getState().edit(editing.id, fields).then((result) => {
        setSaving(false);
        if (!result.ok) return void setError(failureContent(result.failure).body);
        setEditing(null);
      });
    },
  };
};
