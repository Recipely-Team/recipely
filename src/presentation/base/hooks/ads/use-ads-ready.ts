import { useEffect, useState } from 'react';
import { getAdsService } from '@application/ads/get-ads-service';

/**
 * Whether an ad may be requested right now.
 *
 * @remarks
 * - **Starts false and only ever turns true.** A slot renders nothing until the
 *   answer arrives, so a screen never reserves space for an ad that turns out
 *   not to be allowed — reserving first and collapsing afterwards is exactly
 *   the layout jump the placement rules exist to avoid.
 * - **`prepare` is idempotent**, so every slot may call this freely; the
 *   consent gather and the SDK start happen once per session.
 */
export const useAdsReady = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getAdsService()
      .prepare()
      .then((allowed) => {
        if (!cancelled) setReady(allowed);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
};
