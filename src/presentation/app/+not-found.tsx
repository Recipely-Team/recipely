import { Redirect } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * An unknown path lands on the feed.
 *
 * @remarks
 * - **It matches what the host already does.** `firebase.json` rewrites `**` to
 *   `/index.html`, so on the web an unrecognised URL has always been answered
 *   with the app. This makes the router agree with the host instead of leaving
 *   Expo Router's built-in Unmatched screen as the one page that behaves
 *   differently.
 * - **Why it needed a file at all.** Without one, the export shipped
 *   `+not-found.html` carrying an EMPTY `<title>` — the last page with the bug
 *   `PageTitle` fixes, and it is reachable: it is a static file, and Firebase
 *   serves those before it consults a rewrite.
 * - **No analytics name, per rule 25.** A route that renders nothing but a
 *   `Redirect` logs a view nobody had; the screen it lands on reports itself.
 */
export const NotFoundScreen = (): React.JSX.Element => <Redirect href={RoutePaths.recipes} />;

export default NotFoundScreen;
