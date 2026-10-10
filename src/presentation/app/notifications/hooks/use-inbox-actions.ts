import { useCallback, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';

interface InboxActions {
  isRefreshing: boolean;
  /** Pull-to-refresh: re-reads the first page, so new notifications appear without leaving the screen. */
  refresh: () => void;
  /** Marks everything read; a refusal (the store puts the badge back) is said, not swallowed. */
  markAll: () => void;
}

/** The inbox's two list-wide actions. */
export const useInboxActions = (): InboxActions => {
  const { notificationsStore } = useStores();
  const [isRefreshing, setRefreshing] = useState(false);

  const refresh = useCallback((): void => {
    setRefreshing(true);
    void notificationsStore.getState().load().finally(() => setRefreshing(false));
  }, [notificationsStore]);

  const markAll = useCallback((): void => {
    void notificationsStore.getState().markAllRead().then((result) => (result.ok ? undefined : showErrorToast(result.failure)));
  }, [notificationsStore]);

  return { isRefreshing, refresh, markAll };
};
