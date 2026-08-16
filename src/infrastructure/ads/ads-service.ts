import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';
import { recordCrash } from '@infrastructure/firebase/crashlytics-service';

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
 *   and UK); `canRequestAds` is its answer. Initialising before that answer, or
 *   ignoring it, is what turns a working integration into a policy breach.
 * - **"Could not ask" is not "was told no", and only one of them is final.**
 *   A gather that THREW answered nothing: the device was offline, or the
 *   console is mid-configuration. Caching that as a session-long `false` is how
 *   a transient failure became permanent silence — every slot for the rest of
 *   the session read a cached refusal that no user ever gave. A throw therefore
 *   falls back to the consent already stored on the device (the same
 *   `canRequestAds` Google's own sample consults in its failure listener) and
 *   leaves nothing cached, so the next slot to mount asks again. A refusal that
 *   the flow actually RETURNED is final and is cached: re-running a form the
 *   user just dismissed would be the worse bug.
 * - **Silence is still what the user sees, but no longer what we see.** Every
 *   caller is a piece of UI with something better to render, so a failure here
 *   means no ads and no error on screen. It is reported as a non-fatal all the
 *   same: ads that never appear look identical to ads that were never allowed,
 *   and that ambiguity cost a production release where zero requests reached
 *   AdMob and nothing on the device could say why.
 * - **The work happens once.** Both surfaces mount independently, and each
 *   would otherwise re-run the consent gather on every mount.
 */
export class AdsService implements AdsServiceInterface {
  private pending: Promise<boolean> | null = null;
  /** Set when the last run failed to reach an answer, rather than getting one. */
  private retryable = false;

  async prepare(): Promise<boolean> {
    this.pending ??= this.run();
    const allowed = await this.pending;
    if (!allowed && this.retryable) this.pending = null;
    return allowed;
  }

  private async run(): Promise<boolean> {
    this.retryable = false;
    if (!(await this.mayRequestAds())) return false;
    try {
      await mobileAds().initialize();
      return true;
    } catch (error) {
      this.retryable = true;
      recordCrash(error, 'AdsService.initialize');
      return false;
    }
  }

  private async mayRequestAds(): Promise<boolean> {
    try {
      const consent = await AdsConsent.gatherConsent();
      return consent.canRequestAds;
    } catch (error) {
      this.retryable = true;
      recordCrash(error, 'AdsService.gatherConsent');
      return await this.storedConsentAllowsAds();
    }
  }

  /**
   * What the device already knows, when the flow could not be run.
   *
   * The UMP SDK persists the choice a user made on an earlier launch, so a
   * gather that fails on a train still has a truthful answer for anyone who has
   * consented before. A device with nothing stored answers false, which is the
   * conservative direction: it means no ads this attempt, never an ad shown to
   * someone who was owed a form.
   */
  private async storedConsentAllowsAds(): Promise<boolean> {
    try {
      const stored = await AdsConsent.getConsentInfo();
      return stored.canRequestAds;
    } catch {
      return false;
    }
  }
}
