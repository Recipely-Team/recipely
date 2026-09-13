import type { PageTitleProps } from '@presentation/base/widgets/head/page-title-props';

/**
 * Nothing, on a phone. A page's title is a browser concern.
 *
 * @remarks
 * - **Why this half exists at all.** The web half renders `expo-router/head`,
 *   whose iOS implementation does something else entirely: it registers an
 *   `NSUserActivity` for Handoff and Spotlight, and for that it needs an
 *   `origin` in the Expo config. Without one it calls `alert()` — in a RELEASE
 *   build, where `throwOrAlert` deliberately prefers a dialog to a crash. So
 *   the App Store build opened "Expo Head: Add the handoff origin…" over the
 *   onboarding screen, again over login, and again on every screen after that,
 *   because the root layout mounts this on all of them.
 * - **Not fixed by configuring the origin.** That would switch Handoff on:
 *   every screen would advertise a `recipely.net` URL to iOS, including the
 *   draft editor and settings. Turning a feature on to silence a warning is
 *   how a privacy surface arrives by accident — and the title itself was only
 *   ever wanted for the browser tab and for crawlers.
 */
export const PageTitle = (_props: PageTitleProps): React.JSX.Element | null => null;
