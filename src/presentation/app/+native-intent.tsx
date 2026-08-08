import { getShareExtensionKey } from 'expo-share-intent';
import { RoutePaths } from '@presentation/base/constants';

interface NativeIntent {
  path: string;
  initial: boolean;
}

/**
 * Where a native "Share to Recipely" lands before the router sees it.
 *
 * @remarks
 * The iOS share extension does not hand the app a URL it can route. It writes
 * the shared payload into the App Group and opens the host app with a pointer
 * to it — `recipely-dev:///dataUrl=<key>?nonce=…`. expo-router matched that
 * against the route table, found nothing, and rendered "Unmatched Route": the
 * share appeared to open the app and immediately break.
 *
 * `redirectSystemPath` is expo-router's hook for exactly this — a chance to
 * rewrite a system URL before matching. The payload itself is not read here;
 * `useShareIntent` picks it up from the App Group once the app is running, and
 * `useInstagramShareImport` routes it on with the URL it finds.
 *
 * Android never reaches this: it delivers a real intent rather than a URL.
 */
export function redirectSystemPath({ path, initial }: NativeIntent): string {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return RoutePaths.importRecipe;
    }
  } catch {
    // A malformed URL must not stop the app from opening — fall through to the
    // path the OS gave us and let the router decide.
    return initial ? RoutePaths.recipes : path;
  }
  return path;
}
