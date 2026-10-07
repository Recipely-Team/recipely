import { useState } from 'react';
import { CharConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import type { UseShoppingAddDraftResult } from '@presentation/app/shopping-list/model/use-shopping-add-draft-result';

/**
 * The add field's own state: the text being typed and whether it is being sent.
 *
 * @remarks
 * **Owned by the field, not the screen.** The draft used to live in
 * `useShoppingList`, so every keystroke re-rendered the whole screen and every
 * row of the list under the field. Kept here, a keystroke re-renders the field.
 */
export const useShoppingAddDraft = (): UseShoppingAddDraftResult => {
  const { shoppingListStore } = useStores();
  const [draft, setDraft] = useState(CharConstants.empty);
  const [isAdding, setAdding] = useState(false);

  const onAdd = (): void => {
    if (isAdding) return;
    setAdding(true);
    void shoppingListStore.getState().addText(draft).then((result) => {
      setAdding(false);
      if (!result.ok) return void showErrorToast(result.failure);
      setDraft(CharConstants.empty);
    });
  };

  return { draft, onChangeDraft: setDraft, isAdding, onAdd };
};
