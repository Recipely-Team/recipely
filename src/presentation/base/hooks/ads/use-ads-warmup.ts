import { useEffect } from 'react';
import { getAdsService } from '@application/ads/get-ads-service';

/**
 * Starts the consent gather and the SDK init at app start.
 *
 * @remarks
 * - **This is the difference between a banner and a banner that arrives late.**
 *   Without it the work began when the first slot mounted, so the user watched
 *   a consent round-trip, an SDK init and an ad request happen in series on a
 *   screen they were already looking at — the ad appeared seconds in, which
 *   reads as the page still loading.
 * - **It requests nothing.** `prepare` gathers consent and initialises; the
 *   answer is still what every slot waits on, so warming up early cannot put an
 *   ad in front of a user who refused one.
 * - **The result is deliberately dropped.** Whether ads may run is asked, per
 *   slot, by `useAdsReady`; this hook exists only to have the answer ready
 *   before anything asks.
 */
export const useAdsWarmup = (): void => {
  useEffect(() => {
    void getAdsService().prepare();
  }, []);
};
