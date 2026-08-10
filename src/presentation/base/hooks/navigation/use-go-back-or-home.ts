import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Leaves a screen without ever leaving the APP.
 *
 * @remarks
 * `router.back()` on the only screen in the stack closes the app on Android.
 * That is unreachable from the tab bar — but a screen opened by a share intent
 * or a notification tap on a cold start IS the whole stack, so its close button
 * quit the app instead of returning to it. Anything reachable that way has to
 * ask whether there is a back to go to, and land on the feed when there is not.
 */
export const useGoBackOrHome = (): (() => void) => {
  const router = useRouter();

  return useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(RoutePaths.recipes);
  }, [router]);
};
