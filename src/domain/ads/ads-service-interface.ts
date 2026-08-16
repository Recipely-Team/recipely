/**
 * Port for the ad SDK. The infrastructure implementation wraps AdMob (inert on
 * web and, for now, on iOS); consumers resolve it through the DI container.
 *
 * @remarks
 * - **Consent is part of preparing, not a separate step a caller may skip.**
 *   Serving to an EEA/UK user without a certified consent flow, or asking iOS
 *   for a personalised ad before App Tracking Transparency, is a policy breach
 *   rather than a bug — so there is no way to reach an ad request except
 *   through `prepare`, and it answers whether one is allowed at all.
 * - **It answers false rather than throwing.** Every caller is a piece of UI
 *   that has something better to render, and a screen that fails because an ad
 *   did is exactly the intrusion the placement rules exist to avoid.
 */
export interface AdsServiceInterface {
  /**
   * Gathers consent where it is required and initialises the SDK.
   *
   * Resolves `true` when an ad may now be requested, `false` when the user
   * refused, the platform is not serving ads, or the SDK could not start.
   * Safe to call more than once; the work happens on the first call.
   */
  prepare(): Promise<boolean>;
}
