import { ScrollViewStyleReset } from 'expo-router/html';
import { PROD_WEB_APP_BASE_URL } from '@infrastructure/constants/api/api-hosts';
import type { PropsWithChildren } from 'react';

const SITE_URL = PROD_WEB_APP_BASE_URL;

/**
 * Registers the service worker that makes the site installable.
 *
 * Inline and untyped on purpose: this has to run before the bundle does — the
 * install affordance is decided on first paint, and a registration that waits
 * for React means the first visit is never offered the app. `load` keeps it off
 * the critical path all the same.
 */
const SERVICE_WORKER_REGISTRATION = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}`;

const SITE_TITLE = 'Recipely — AI Recipe Generator & Cooking Community';
const SITE_DESCRIPTION =
  'Discover, create, and share recipes with an AI sous-chef. Generate a full recipe from a craving, browse by cuisine, track nutrition, and cook smarter with Recipely.';

/**
 * Customizes the static HTML shell Expo Router emits for web export. Without
 * this, the exported `index.html` has an empty `<title>` and no meta
 * description or Open Graph tags, so search engines and link previews have
 * nothing to show for the root domain (the marketing content otherwise only
 * lives under `/about`).
 *
 * @remarks
 * - **No ad loader here, deliberately.** This shell wraps EVERY route — login,
 *   register, verify-code, onboarding, settings, create-recipe, the lot — so
 *   the AdSense script it used to carry ran on pages holding no publisher
 *   content at all. The site declares no ad unit of its own
 *   (`ad-slot.web.tsx` renders nothing), so every ad it ever served was an Auto
 *   Ad placed on one of those pages: exactly the "ads on screens without
 *   publisher content" violation AdSense flagged. A web ad belongs to a page
 *   that has earned it and is added on that page — never to the shell.
 */
export const RootHtml = ({ children }: PropsWithChildren): React.ReactElement => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
      <title>{SITE_TITLE}</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <link rel="canonical" href={SITE_URL} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:title" content={SITE_TITLE} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SITE_TITLE} />
      <meta name="twitter:description" content={SITE_DESCRIPTION} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      {/* Colours the OS/browser chrome around the app. Two, because the app
          follows the system scheme and a single value leaves the bar fighting
          the page it sits on in one of them. */}
      <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0B0B0D" media="(prefers-color-scheme: dark)" />
      {/* `apple-` is the legacy spelling iOS still reads; the unprefixed one is
          what everything else does. Both, until iOS catches up. */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Recipely" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_REGISTRATION }} />
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>
);

export default RootHtml;
