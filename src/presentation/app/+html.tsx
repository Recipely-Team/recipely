import { ScrollViewStyleReset } from 'expo-router/html';
import { PROD_WEB_APP_BASE_URL } from '@infrastructure/constants/api/api-hosts';
import { ADSENSE_CLIENT_ID } from '@infrastructure/constants/ads';
import type { PropsWithChildren } from 'react';

const SITE_URL = PROD_WEB_APP_BASE_URL;

/**
 * The AdSense loader, on the production site only.
 *
 * `dev.recipely.net` is not a site declared in AdSense and is served `noindex`
 * behind an access wall; putting ad code on it would be serving ads from a
 * property the account has not claimed. This file is rendered by `expo export`
 * in Node, so the build's own variable decides — the same one that already
 * picks the API host and the app id.
 */
const SERVES_ADS = process.env.APP_VARIANT !== 'development';
const SITE_TITLE = 'Recipely — AI Recipe Generator & Cooking Community';
const SITE_DESCRIPTION =
  'Discover, create, and share recipes with an AI sous-chef. Generate a full recipe from a craving, browse by cuisine, track nutrition, and cook smarter with Recipely.';

/**
 * Customizes the static HTML shell Expo Router emits for web export. Without this,
 * the exported `index.html` has an empty `<title>` and no meta description or Open
 * Graph tags, so search engines and link previews have nothing to show for the root
 * domain (the marketing content otherwise only lives under `/about`).
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
      {SERVES_ADS ? (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      ) : null}
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>
);

export default RootHtml;
