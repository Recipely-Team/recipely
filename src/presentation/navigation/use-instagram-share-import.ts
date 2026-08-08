import { useEffect, useRef } from 'react';
import { isAndroid } from '@infrastructure/constants/platform';
import { useRouter } from 'expo-router';
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
 * Bridges an incoming Android "Share to Recipely" intent into the import flow.
 * When the shared content is an Instagram link it routes to
 * `/import-recipe?importUrl=…` — the queue screen, NOT the create form: the
 * work happens on a worker and there is nothing to edit until it lands — and
 * clears the native share intent so the same share never re-fires. Cold-start (app launched by the share) and warm
 * (already running) are both covered by reacting to `hasShareIntent`. No-op
 * outside Android and for non-Instagram shares.
 */
export const useInstagramShareImport = (): void => {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!isAndroid()) return;
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
    router.push({ pathname: RoutePaths.importRecipe, params: { importUrl: url } });
  }, [hasShareIntent, shareIntent, resetShareIntent, router]);
};
