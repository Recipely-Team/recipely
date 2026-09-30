import { useCallback } from 'react';
import { type Href, useRouter } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Back from a creators page: to wherever the user came from, or to the feed
 * when the page was opened cold (a shared link on the web has no history, and
 * `back()` there would do nothing).
 */
export const useCreatorsBack = (): (() => void) => {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(RoutePaths.recipes as Href);
  }, [router]);
};
