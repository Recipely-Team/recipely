import { useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { CharConstants } from '@core/constants';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';

/**
 * Names the page a visitor is on, for the browser tab and for a crawler.
 *
 * @remarks
 * - **Through the navigator, not `document.title`.** React Navigation owns that
 *   property: it reassigns `options.title ?? route.name` on every navigation,
 *   so a direct write is overwritten by the next one. Setting the option means
 *   the name survives a push and comes back on the way out.
 * - **Native is unaffected.** Every routed screen here sets `headerShown:
 *   false` and draws its own chrome, so `title` reaches nothing on a phone —
 *   it exists for the web build, where it is the page's name.
 * - **The suffix is not decoration.** A recipe page titled only "Kısır" says
 *   nothing about where it is; every search result and every shared tab reads
 *   better with the site on the end, and it is what stops two sites' pages
 *   looking identical in a list of results.
 * - **An empty subject is not a title.** Before its data arrives a screen has
 *   nothing to call itself, and `"" · Recipely` is worse than the site's own
 *   name — so a blank falls back rather than being decorated.
 *
 * @param subject the page's own name, or empty while it is still loading.
 */
export const usePageTitle = (subject: string): void => {
  const navigation = useNavigation();

  useEffect(() => {
    const trimmed = subject.trim();
    navigation.setOptions({
      title:
        trimmed === CharConstants.empty
          ? SiteMetadata.title
          : `${trimmed}${SiteMetadata.titleSuffix}`,
    });
  }, [navigation, subject]);
};
