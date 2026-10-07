import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { CharConstants } from '@core/constants';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { ShoppingConfirm, type ShoppingConfirmType } from '@presentation/app/shopping-list/model/shopping-confirm';
import { shoppingRows } from '@presentation/app/shopping-list/model/shopping-rows';
import type { UseShoppingListResult } from '@presentation/app/shopping-list/model/use-shopping-list-result';
import { t } from '@presentation/i18n';

/**
 * Drives the Shopping list screen: the paged list, the add field, ticks,
 * deletes and the two clears.
 *
 * @remarks
 * - **Loaded on focus**, so a recipe added from another screen is there when
 *   the user comes back; a loaded list refreshes in place rather than blanking.
 * - **Ticks and deletes are optimistic in the store**; a refusal is put back
 *   there and said here, in a toast.
 * - **Signed-out users never reach this screen** — the auth guard sends them
 *   to sign-in with a redirect back.
 */
export const useShoppingList = (): UseShoppingListResult => {
  const router = useRouter();
  const { shoppingListStore } = useStores();
  const list = shoppingListStore((s) => s.list);
  const isRefreshing = shoppingListStore((s) => s.isRefreshing);
  const [draft, setDraft] = useState(CharConstants.empty);
  const [isAdding, setAdding] = useState(false);
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
  const rows = useMemo(() => shoppingRows(items, t().shopping.toBuy, t().shopping.completed), [items]);

  const onAdd = (): void => {
    if (isAdding) return;
    setAdding(true);
    void shoppingListStore.getState().addText(draft).then((result) => {
      setAdding(false);
      if (!result.ok) return void showErrorToast(result.failure);
      setDraft(CharConstants.empty);
    });
  };

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
    checkedCount: items.filter((item) => item.checked).length,
    isRefreshing,
    onRefresh: () => {
      void shoppingListStore.getState().refresh().then((failure) => {
        if (failure !== null) showErrorToast(failure);
      });
    },
    onRetry: () => void shoppingListStore.getState().load(),
    onEndReached: () => void shoppingListStore.getState().loadMore(),
    onBack: () => (router.canGoBack() ? router.back() : router.replace(RoutePaths.profile)),
    draft,
    onChangeDraft: setDraft,
    isAdding,
    onAdd,
    onToggle: (item) => {
      void shoppingListStore.getState().setChecked(item, !item.checked).then((result) => {
        if (!result.ok) showErrorToast(result.failure);
      });
    },
    onRemove: (item) => {
      void shoppingListStore.getState().remove(item).then((result) => {
        if (!result.ok) showErrorToast(result.failure);
      });
    },
    confirm,
    isConfirming,
    onAskConfirm: setConfirm,
    onConfirm,
    onCloseConfirm: () => setConfirm(null),
  };
};
