import { ScrollViewStyleReset } from 'expo-router/html';
import { PROD_WEB_APP_BASE_URL } from '@infrastructure/constants/api/api-hosts';
import type { PropsWithChildren } from 'react';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';

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
      {/* No <title> here. Expo Router mounts react-helmet-async at the root
          and it emits its OWN <title> ahead of anything this shell writes, so
          a title here is a SECOND one — invalid, and never the one
          `document.title` reads. `PageTitle` fills helmet's element instead.
          The static tags below are helmet-free and stay. */}
      <meta name="description" content={SiteMetadata.description} />
      <link rel="canonical" href={SITE_URL} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:title" content={SiteMetadata.title} />
      <meta property="og:description" content={SiteMetadata.description} />
      <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SiteMetadata.title} />
      <meta name="twitter:description" content={SiteMetadata.description} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      {/* `use-credentials` is not optional here. A manifest is fetched WITHOUT
          cookies by default, even same-origin — so on dev.recipely.net, which
          sits behind Cloudflare Access, the request was redirected to the login
          page, the manifest parsed as nothing, and Chrome offered no install.
          The service worker was fine all along: its script fetch does send
          cookies. Harmless on an origin with no auth wall. */}
      <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
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
