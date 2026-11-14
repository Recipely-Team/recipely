import { useCallback } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { shoppingShareText } from '@presentation/app/shopping-list/model/shopping-share-text';
import { useTranslations } from '@presentation/i18n';

/**
 * Shares the shopping list as a checklist through the system sheet — to a
 * partner on the way to the shop, or into a notes app.
 *
 * @remarks
 * - **Falls back to copying.** A desktop browser has no share sheet, so the
 *   text goes on the clipboard with a "Copied" toast instead of nothing.
 * - **Answers whether there was anything to share**, so the voice action can
 *   say an empty list is empty rather than claim it shared it.
 */
export const useShareShoppingList = (items: readonly ShoppingItemEntity[]): (() => boolean) => {
  const t = useTranslations();
  return useCallback((): boolean => {
    if (items.length === ValueConstants.zero) return false;
    const copy = t.shopping;
    const message = shoppingShareText(items, {
      title: copy.title,
      toBuy: copy.toBuy,
      completed: copy.completed,
      decimalMark: t.recipes.portions.decimalMark,
    });
    void Share.share({ message, title: copy.title }).catch(async () => {
      try {
        await Clipboard.setStringAsync(message);
        showSuccessToast(t.recipes.shareCopied);
      } catch {
        // Neither a share sheet nor a clipboard: nothing left to offer.
      }
    });
    return true;
  }, [items, t]);
};
