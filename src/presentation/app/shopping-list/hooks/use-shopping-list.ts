import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { ShoppingConfirm, type ShoppingConfirmType } from '@presentation/app/shopping-list/model/shopping-confirm';
import { shoppingRows } from '@presentation/app/shopping-list/model/shopping-rows';
import type { UseShoppingListResult } from '@presentation/app/shopping-list/model/use-shopping-list-result';
import { t } from '@presentation/i18n';
import { useLocale } from '@presentation/i18n/use-locale';

/**
 * Drives the Shopping list screen: the paged list, ticks, deletes and the two
 * clears. The add field owns its draft (`useShoppingAddDraft`).
 *
 * @remarks
 * - **Loaded on focus**, so a recipe added from another screen is there when
 *   the user comes back; a loaded list refreshes in place rather than blanking.
 * - **Ticks and deletes are optimistic in the store**; a refusal is put back
 *   there and said here, in a toast.
 * - **Signed-out users never reach this screen** — the auth guard sends them
 *   to sign-in with a redirect back.
 * - **Row handlers are stable** (`useCallback`), so the memoised rows re-render
 *   only when their own line changes.
 */
export const useShoppingList = (): UseShoppingListResult => {
  const router = useRouter();
  const { shoppingListStore } = useStores();
  const list = shoppingListStore((s) => s.list);
  const isRefreshing = shoppingListStore((s) => s.isRefreshing);
  const [confirm, setConfirm] = useState<ShoppingConfirmType | null>(null);
  const [isConfirming, setConfirming] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const store = shoppingListStore.getState();
      if (store.list.status === StoreStatus.Loaded) void store.refresh();
      else void store.load();
    }, [shoppingListStore]),
  );

  const items = loadedItems(list);
  useLocale();
  // The section labels are copy: a language switch must rebuild them, not only a list change.
  const { toBuy, completed } = t().shopping;
  const { rows, checkedCount } = useMemo(
    () => ({ rows: shoppingRows(items, toBuy, completed), checkedCount: items.filter((item) => item.checked).length }),
    [items, toBuy, completed],
  );

  const onToggle = useCallback(
    (item: ShoppingItemEntity): void => {
      void shoppingListStore.getState().setChecked(item, !item.checked).then((result) => {
        if (!result.ok) showErrorToast(result.failure);
      });
    },
    [shoppingListStore],
  );
  const onRemove = useCallback(
    (item: ShoppingItemEntity): void => {
      void shoppingListStore.getState().remove(item).then((result) => {
        if (!result.ok) {
      showErrorToast(result.failure);
      return;
    }
        toastStore.getState().show({
          severity: SeverityType.Neutral,
          message: t().shopping.removedItem.replace('{x}', item.label),
          actionLabel: t().common.undo,
          onAction: () => void shoppingListStore.getState().addDrafts([item.toDraft()]).then((back) => (back.ok ? undefined : showErrorToast(back.failure))),
        });
      });
    },
    [shoppingListStore],
  );

  const onConfirm = (): void => {
    if (confirm === null) return;
    setConfirming(true);
    const store = shoppingListStore.getState();
    const run = confirm === ShoppingConfirm.ClearChecked ? store.clearChecked() : store.clearAll();
    void run.then((result) => {
      setConfirming(false);
      setConfirm(null);
      if (!result.ok) return void showErrorToast(result.failure);
      showSuccessToast(t().shopping.cleared.replace('{n}', String(result.value)));
    });
  };

  return {
    list,
    rows,
    items,
    checkedCount,
    isRefreshing,
    onRefresh: () => {
      void shoppingListStore.getState().refresh().then((failure) => {
        if (failure !== null) showErrorToast(failure);
      });
    },
    onRetry: () => void shoppingListStore.getState().load(),
    onEndReached: () => void shoppingListStore.getState().loadMore(),
    onBack: () => (router.canGoBack() ? router.back() : router.replace(RoutePaths.profile)),
    onToggle,
    onRemove,
    confirm,
    isConfirming,
    onAskConfirm: setConfirm,
    onConfirm,
    onCloseConfirm: () => setConfirm(null),
  };
};
