import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';

/**
 * Null-object ad service, used where no real one is registered: the web shell,
 * a platform ads are not enabled on yet, and unit test mounts that never build
 * the container. It reports that no ad may be requested, which is the answer
 * that makes every ad slot render nothing.
 */
export const noopAdsService: AdsServiceInterface = {
  prepare: async () => false,
};
