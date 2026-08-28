import { Redirect } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Takes expo-router's development sitemap out of the shipped app.
 *
 * @remarks
 * - **It is a crash, not a stray screen.** expo-router appends its own
 *   `_sitemap` route whenever this file is absent, and that screen renders
 *   `SystemInfo`, which reads `window.location.origin`. React Native has no
 *   `window.location`, so opening `/_sitemap` on a device is a fatal
 *   `TypeError: Cannot read property 'origin' of undefined`. Crashlytics
 *   recorded it from an emulator walking routes on 1.1.0 (863); it has been
 *   reachable since 1.0.45.
 * - **Why a file and not a setting.** `sitemap: false` exists inside the
 *   router store, but `qualified-entry.js` renders `<ExpoRoot>` with no
 *   `config` prop, so the flag keeps its `true` default and nothing in app
 *   config reaches it. Providing the route is the supported override —
 *   `getRoutesCore` only generates its own when the context has none.
 * - **Redirect, not an empty screen.** Whoever arrives here followed a link
 *   that does not exist for users; the feed is where they meant to be.
 */
export function Sitemap(): React.JSX.Element {
  return <Redirect href={RoutePaths.recipes} />;
}

export default Sitemap;
