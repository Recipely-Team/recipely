import Head from 'expo-router/head';
import { CharConstants } from '@core/constants';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';

export interface PageTitleProps {
  /** The page's own name, or empty while it is still loading. */
  subject?: string;
}

/**
 * Names the page, for the browser tab and for a crawler.
 *
 * @remarks
 * - **Through `Head`, because helmet owns the element.** Expo Router mounts
 *   react-helmet-async at the root and seeds it with `title: ""`, so the static
 *   export ships TWO `<title>` elements — helmet's empty one first, then the
 *   one `+html.tsx` writes. `document.title` is the text of the FIRST, which is
 *   why the site rendered a blank tab while its HTML plainly contained a title.
 *   Writing through `Head` fills helmet's own element instead of adding a
 *   third.
 * - **Not through the navigator.** The obvious-looking fix — a `title` in
 *   `screenOptions`, or `navigation.setOptions` — does nothing at all here:
 *   Expo Router constructs its `NavigationContainer` with
 *   `documentTitle: { enabled: false }` (`ExpoRoot.js`), so React Navigation's
 *   title updater never runs. It is switched off precisely because this `Head`
 *   is the supported route.
 * - **Deepest wins.** Helmet takes the last mounted value, so the root layout
 *   renders this with no subject and a page with a real name renders it again
 *   with one. A screen that says nothing keeps the site's title rather than
 *   inheriting a stale one.
 * - **An empty subject is not a title.** Before its data arrives a screen has
 *   nothing to call itself, and `" · Recipely"` is worse than the site's own
 *   name — so a blank falls back rather than being decorated.
 */
export const PageTitle = ({ subject = CharConstants.empty }: PageTitleProps): React.JSX.Element => {
  const trimmed = subject.trim();
  const title =
    trimmed === CharConstants.empty
      ? SiteMetadata.title
      : `${trimmed}${SiteMetadata.titleSuffix}`;

  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
};
