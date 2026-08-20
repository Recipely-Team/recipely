import { useEffect, useState } from 'react';
import { getAdsService } from '@application/ads/get-ads-service';

/**
 * Whether the session has already been told yes. Module scope, because the
 * answer is about the app, not about the slot that happened to ask.
 */
let allowed = false;

/**
 * Whether an ad may be requested right now.
 *
 * @remarks
 * - **Starts false and only ever turns true.** A slot renders nothing until the
 *   answer arrives, so a screen never reserves space for an ad that turns out
 *   not to be allowed — reserving first and collapsing afterwards is exactly
 *   the layout jump the placement rules exist to avoid.
 * - **A yes is remembered, and that is what makes the banner prompt.** The
 *   answer used to be re-awaited per mount even though `useAdsWarmup` had
 *   settled it at launch: every slot rendered `null` first, resolved an
 *   already-resolved promise, set state, and only THEN mounted the banner — so
 *   each ad row spent a render and a native view creation doing nothing before
 *   its request even went out, and every banner arrived a beat after the row
 *   it belongs to. Seeded from a known yes, the request leaves on the first
 *   render of the row instead.
 * - **A no is NOT remembered here.** `AdsService` already distinguishes "the
 *   user refused" from "nobody could be asked" and retries only the second;
 *   caching `false` in front of it would turn one offline launch into a session
 *   with no ads, which is the bug that service was written to stop.
 * - **`prepare` is idempotent**, so every slot may call this freely; the
 *   consent gather and the SDK start happen once per session.
 */
export const useAdsReady = (): boolean => {
  const [ready, setReady] = useState(allowed);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void getAdsService()
      .prepare()
      .then((result) => {
        if (result) allowed = true;
        if (!cancelled) setReady(result);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
};
