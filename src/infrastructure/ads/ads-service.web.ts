import { webFeedSlotId } from '@infrastructure/constants/ads';
import { CharConstants } from '@core/constants';
import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';

/**
 * Web build of the ad service.
 *
 * @remarks
 * - **It initialises nothing.** The mobile SDK has no web target, so this file
 *   exists first of all to keep that native module out of the web bundle, where
 *   importing it fails the build rather than degrading.
 * - **`prepare` still answers the question the feed asks**, which is whether an
 *   ad may be requested at all — on the web that is simply whether the deploy
 *   was given an AdSense unit. Answering `false` unconditionally, as this did
 *   while the site served no ads, left the feed building no ad rows for the web
 *   slot to fill.
 * - **Consent is not gathered here.** The native side runs Google's UMP flow;
 *   on the web the AdSense loader serves the publisher's own GDPR message,
 *   configured in the AdSense console rather than in this app.
 */
export class AdsService implements AdsServiceInterface {
  async prepare(): Promise<boolean> {
    return webFeedSlotId() !== CharConstants.empty;
  }
}
