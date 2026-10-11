import { useCallback } from 'react';
import { type Href, useRouter } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Leaves a screen without ever leaving the APP.
 *
 * @remarks
 * - **Why it exists.** `router.back()` on the only screen in the stack closes
 *   the app on Android and does nothing on iOS and the web. A screen opened by
 *   a share intent, a notification tap, a shared link or a search result on a
 *   cold start IS the whole stack, so its back button dead-ended. Anything
 *   reachable that way asks whether there is a back to go to first.
 * - **`fallback` is where a cold-started screen lands** — the feed unless the
 *   screen belongs somewhere more specific (Edit Profile → Profile, the auth
 *   forms → Login). `check:structure` rule AS bans a bare `router.back()`
 *   under `app/`.
 */
export const useGoBackOrHome = (fallback: string = RoutePaths.recipes): (() => void) => {
  const router = useRouter();

  return useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    // Cast: a RoutePaths string is not in the typed-routes union.
    router.replace(fallback as Href);
  }, [router, fallback]);
};
