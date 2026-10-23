import { StoreStatus } from '@application/store/store-status';
import { useStore } from 'zustand';
import { useStores } from '@presentation/bootstrap/use-stores';

/** Whether a user is signed in; re-renders only when that answer flips (see `useSignedInUserId`). */
export const useIsSignedIn = (): boolean => {
  const { authStore } = useStores();
  return useStore(authStore, (s) => s.state.status === StoreStatus.Authenticated);
};
