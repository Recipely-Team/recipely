import { useEffect } from 'react';
import { useStore } from 'zustand';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useIsSignedIn } from '@presentation/base/hooks/auth/use-is-signed-in';

/**
 * Whether the signed-in account is premium, as the backend confirmed it.
 *
 * @remarks
 * - **Asks once per session.** The first screen that needs it triggers the check;
 *   every later caller reads the stored answer.
 * - **Unknown reads as free.** Until the backend answers, or when it cannot, the
 *   app behaves as for a free account; it never shows premium on a guess.
 */
export const useIsPremium = (): boolean => {
  const { premiumStore } = useStores();
  const isSignedIn = useIsSignedIn();
  const isPremium = useStore(premiumStore, (s) => s.entitlement?.isPremium === true);
  const hasChecked = useStore(premiumStore, (s) => s.hasChecked);

  useEffect(() => {
    if (isSignedIn && !hasChecked) void premiumStore.getState().refresh();
  }, [isSignedIn, hasChecked, premiumStore]);

  return isSignedIn && isPremium;
};
