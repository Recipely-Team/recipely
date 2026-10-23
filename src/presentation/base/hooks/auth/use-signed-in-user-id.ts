import { StoreStatus } from '@application/store/store-status';
import { useStore } from 'zustand';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * The signed-in user's id, or `null` for a guest.
 *
 * @remarks
 * - **Selects a string, not the auth state.** Zustand re-renders a subscriber
 *   when its selected value changes by `Object.is`. Selecting `s.state`
 *   re-rendered every caller (every feed row among them) whenever the session
 *   object was replaced: a profile edit, a creator-claim refresh. The id does
 *   not change then, so neither does anything that reads only the id.
 */
export const useSignedInUserId = (): string | null => {
  const { authStore } = useStores();
  return useStore(authStore, (s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user.id : null));
};
