import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { isAndroid } from '@infrastructure/constants/platform';
import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';

/**
 * AdMob behind the {@link AdsServiceInterface} port.
 *
 * @remarks
 * - **Android only, for now.** iOS additionally needs App Tracking Transparency
 *   and goes through an App Review that has already rejected this app once, so
 *   it is switched on separately once the Android numbers say the placement is
 *   right. The plugin still configures iOS, so turning it on is a one-line
 *   change here rather than a build change.
 * - **Consent comes first and decides everything.** `gatherConsent` runs the
 *   Google-certified flow, showing a form only where one is required (the EEA
 *   and UK); `canRequestAds` is its answer, and it can be false because the
 *   user said no. Initialising before that answer, or ignoring it, is what
 *   turns a working integration into a policy breach.
 * - **A failure here is silence, not an error.** Every caller is a piece of UI
 *   with something better to render, so a consent form that could not load
 *   means no ads this session and nothing else. It is deliberately not reported
 *   as a crash: the user's experience is complete without it.
 * - **The work happens once.** Both surfaces mount independently, and each
 *   would otherwise re-run the consent gather on every mount.
 */
export class AdsService implements AdsServiceInterface {
  private pending: Promise<boolean> | null = null;

  async prepare(): Promise<boolean> {
    if (!isAndroid()) return false;
    this.pending ??= this.run();
    return await this.pending;
  }

  private async run(): Promise<boolean> {
    try {
      const consent = await AdsConsent.gatherConsent();
      if (!consent.canRequestAds) return false;
      await mobileAds().initialize();
      return true;
    } catch {
      // Deliberately swallowed — see the "silence, not an error" remark above.
      return false;
    }
  }
}
