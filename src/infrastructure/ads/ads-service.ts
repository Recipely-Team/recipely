import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';
import { recordCrash } from '@infrastructure/firebase/crashlytics-service';
import { ValueConstants } from '@core/constants';

/**
 * How a single preparation attempt ended.
 *
 * Three outcomes rather than a boolean plus a flag: "allowed", "the user said
 * no" and "nobody could be asked" are what the caller has to tell apart, and
 * folding two of them into `false` is exactly the bug this file exists to fix.
 * Unexported — only the class below names it (CLAUDE.md rule 1).
 */
const RunOutcome = {
  Allowed: 'allowed',
  Refused: 'refused',
  Unavailable: 'unavailable',
} as const;

type RunOutcomeType = (typeof RunOutcome)[keyof typeof RunOutcome];

/**
 * Attempts a session will make before it stops asking.
 *
 * `prepare` is called from `useAdsReady`, which runs on every `AdSlot` mount —
 * and a slot is a FlatList row, so windowing mounts it again every time it
 * scrolls back into view. Unbounded retrying would fire a native consent call
 * per row for as long as the device stays offline. Three attempts is enough to
 * outlast a launch that raced the network and few enough to be invisible.
 */
const MAX_ATTEMPTS = 3;

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
 *   console is mid-configuration. Caching that as a session-long refusal is how
 *   a transient failure became permanent silence — every slot for the rest of
 *   the session read an answer no user had given. `Unavailable` therefore
 *   discards the cached run so the next slot asks again; `Refused` keeps it,
 *   because re-running a form the user just dismissed would be the worse bug.
 * - **The retry is bounded, and so is what it reports.** The caller is a list
 *   row that remounts as the feed scrolls, so "ask again" without a ceiling is
 *   a native call and a crash report per row. `MAX_ATTEMPTS` caps the asking
 *   and each context is reported once per session.
 * - **A stored answer is read by its status, not by `canRequestAds` alone.**
 *   A device that has never seen the form reports `UNKNOWN`/`REQUIRED` with
 *   `canRequestAds: false` — which is "not asked yet", not "declined". Treating
 *   that pair as a refusal would silence a first launch that merely happened to
 *   be offline, so only `OBTAINED` counts as the user having answered.
 * - **Silence is still what the user sees, but no longer what we see.** Every
 *   caller is a piece of UI with something better to render, so a failure here
 *   means no ads and no error on screen. It is reported as a non-fatal all the
 *   same: ads that never appear look identical to ads that were never allowed,
 *   and that ambiguity cost a production release where zero requests reached
 *   AdMob and nothing on the device could say why.
 * - **The work happens once per outcome that settles it.** Both surfaces mount
 *   independently, and each would otherwise re-run the consent gather.
 */
export class AdsService implements AdsServiceInterface {
  private pending: Promise<RunOutcomeType> | null = null;
  private attempts = ValueConstants.zero;
  /** Contexts already sent to crash reporting this session. */
  private readonly reported = new Set<string>();

  async prepare(): Promise<boolean> {
    this.pending ??= this.run();
    // WHY the outcome rides on the awaited promise rather than an instance
    // flag: concurrent callers await the same run, and a flag read after the
    // await describes whichever run finished last. The identity check is the
    // same hazard one level up — a late awaiter of an older run must not clear
    // a newer one that has already taken its place.
    const started = this.pending;
    const outcome = await started;
    if (
      outcome === RunOutcome.Unavailable &&
      this.attempts < MAX_ATTEMPTS &&
      this.pending === started
    ) {
      this.pending = null;
    }
    return outcome === RunOutcome.Allowed;
  }

  private async run(): Promise<RunOutcomeType> {
    this.attempts += ValueConstants.one;
    const consent = await this.gatherConsent();
    if (consent !== RunOutcome.Allowed) return consent;
    try {
      await mobileAds().initialize();
      return RunOutcome.Allowed;
    } catch (error) {
      this.report(error, 'AdsService.initialize');
      return RunOutcome.Unavailable;
    }
  }

  private async gatherConsent(): Promise<RunOutcomeType> {
    try {
      const consent = await AdsConsent.gatherConsent();
      return consent.canRequestAds ? RunOutcome.Allowed : RunOutcome.Refused;
    } catch (error) {
      this.report(error, 'AdsService.gatherConsent');
      return await this.storedConsent();
    }
  }

  /**
   * What the device already knows, when the flow could not be run.
   *
   * The UMP SDK persists the choice a user made on an earlier launch, so a
   * gather that fails on a train still has a truthful answer for anyone who has
   * been through the form — including a "no", which is final and stops the
   * retrying. Anything else is an absence of an answer rather than a negative
   * one, and stays retryable.
   */
  private async storedConsent(): Promise<RunOutcomeType> {
    try {
      const stored = await AdsConsent.getConsentInfo();
      if (stored.canRequestAds) return RunOutcome.Allowed;
      return stored.status === AdsConsentStatus.OBTAINED
        ? RunOutcome.Refused
        : RunOutcome.Unavailable;
    } catch {
      // Deliberately silent, and the one place in this file that is: the gather
      // failure that sent us here was already reported, and this call fails for
      // the same reason. A second non-fatal would say nothing the first did not.
      return RunOutcome.Unavailable;
    }
  }

  /** Sends a failure to crash reporting the first time its context fails. */
  private report(error: unknown, context: string): void {
    if (this.reported.has(context)) return;
    this.reported.add(context);
    recordCrash(error, context);
  }
}
