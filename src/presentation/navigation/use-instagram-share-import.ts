import { useEffect, useRef } from 'react';
import { isWeb } from '@infrastructure/constants/platform';
import { usePathname, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const INSTAGRAM_HOST = 'instagram.com';

/** Pulls the first Instagram URL out of an incoming share's text/webUrl. */
const extractInstagramUrl = (text?: string | null, webUrl?: string | null): string | null => {
  const candidates = [webUrl ?? CharConstants.empty, text ?? CharConstants.empty];
  for (const candidate of candidates) {
    const match = candidate.match(/https?:\/\/\S+/);
    const url = match?.[ValueConstants.zero] ?? candidate.trim();
    if (url.toLowerCase().includes(INSTAGRAM_HOST)) return url;
  }
  return null;
};

/**
 * Bridges an incoming "Share to Recipely" into the import flow.
 *
 * @remarks
 * An Instagram link routes to `/import-recipe?importUrl=…` — the queue screen,
 * NOT the create form: the work happens on a worker and there is nothing to
 * edit until it lands. The native share intent is cleared so the same share
 * never re-fires, and both cold start (the app launched BY the share) and warm
 * are covered by reacting to `hasShareIntent`.
 *
 * Both native platforms reach here now: iOS gained the share extension when
 * `disableIOS` came off the `expo-share-intent` plugin. The web has no share
 * sheet at all, which is what the paste screen is for.
 */
export const useInstagramShareImport = (): void => {
  const router = useRouter();
  const pathname = usePathname();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const handledRef = useRef(false);

  useEffect(() => {
    if (isWeb()) return;
    if (!hasShareIntent) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;

    const url = extractInstagramUrl(shareIntent.text, shareIntent.webUrl);
    if (url === null) {
      resetShareIntent();
      return;
    }

    handledRef.current = true;
    resetShareIntent();
    // expo-router serializes/deserializes object-form params itself, so the raw
    // URL rides through without a manual encode/decode pair on either side.
    // REPLACE when the import screen is already up. Pushing stacked a second
    // copy: both instances stayed mounted, both polled the one job at 4 s, and
    // popping back revealed a screen reporting the other share's progress.
    const target = { pathname: RoutePaths.importRecipe, params: { importUrl: url } };
    if (pathname === RoutePaths.importRecipe) router.replace(target);
    else router.push(target);
  }, [hasShareIntent, shareIntent, resetShareIntent, router, pathname]);
};
