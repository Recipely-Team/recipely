import { ScrollViewStyleReset } from 'expo-router/html';
import { PROD_WEB_APP_BASE_URL } from '@infrastructure/constants/api/api-hosts';
import type { PropsWithChildren } from 'react';

const SITE_URL = PROD_WEB_APP_BASE_URL;
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
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>
);

export default RootHtml;
