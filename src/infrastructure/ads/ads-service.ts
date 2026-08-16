import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';

/**
 * AdMob behind the {@link AdsServiceInterface} port.
 *
 * @remarks
 * - **Both mobile platforms; the web has its own build of this file.** There is
 *   no platform check left here — `ads-service.web.ts` is what answers on the
 *   web, and a check for one of two remaining platforms is a check that will be
 *   wrong the day a third arrives.
 * - **No App Tracking Transparency, and therefore no tracking.** iOS ads run
 *   CONTEXTUAL: the SDK this version ships has no ATT call, and adding one would
 *   put a new permission prompt in front of an App Review that has already
 *   rejected this app once — for a prompt most users decline anyway, whose
 *   decline lands us exactly where we already are. It also keeps the App Store
 *   privacy declaration honest at "no tracking". Personalised iOS ads are a
 *   later decision, and they cost an ATT prompt plus a privacy-label change.
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
