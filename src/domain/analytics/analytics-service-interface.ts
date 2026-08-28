/**
 * Port for product analytics. Implemented per platform in infrastructure —
 * `@react-native-firebase/analytics` on native, the Firebase JS SDK on web —
 * and reached only from the composition root, which is the one place allowed
 * to know which of the two it got.
 *
 * @remarks
 * - **Why a port for a pair nothing resolves through DI.** The two halves are
 *   chosen by the bundler, not by a container, so nothing type-checks them
 *   against each other: they declared the same three signatures twice, and
 *   dropping a method from the web half compiled, linted and passed every test
 *   while the web build silently stopped reporting (rule 13).
 * - **Nothing here returns a `Result`.** Analytics is fire-and-forget by
 *   design: a screen must never fail, or wait, because a metric could not be
 *   sent. Every implementation swallows its own errors.
 */
export interface AnalyticsServiceInterface {
  /** Turns collection on or off. Kept off in development. */
  setEnabled(enabled: boolean): Promise<void>;

  /** Records a custom event, named from the `AnalyticsEvent` catalogue. */
  logEvent(name: string, params?: Record<string, string | number | boolean>): Promise<void>;

  /**
   * Records a screen view. `screenClass` defaults to `screenName`, because the
   * names come from the route's own component and there is nothing else to say.
   */
  logScreen(screenName: string, screenClass?: string): Promise<void>;
}
