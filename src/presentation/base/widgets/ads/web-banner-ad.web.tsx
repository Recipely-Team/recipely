import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CharConstants } from '@core/constants';
import { UnknownFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { spacing } from '@presentation/base/theme';
import { mountAdsenseUnit } from '@presentation/base/widgets/ads/mount-adsense-unit.web';
import type { WebBannerAdProps } from '@presentation/base/widgets/ads/web-banner-ad-props';

/** Whether this session has already filed the one report it is allowed. */
let reported = false;

/**
 * One AdSense display unit. **Web build** — see `web-banner-ad.tsx`.
 *
 * @remarks
 * - **No slot id means no element.** The id arrives from the deploy
 *   (`EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID`), and a build that never received
 *   it renders nothing rather than an empty box where an ad was meant to be.
 * - **The host is a plain `View` the unit is appended into.** React owns the
 *   container and AdSense owns its contents, so the two never reconcile the
 *   same node — the effect cleans the host out on unmount, which is what lets a
 *   route change re-request an ad instead of re-showing the last one.
 * - **The space is not reserved.** No `minHeight`: an unfilled or blocked unit
 *   should leave the page as it found it, and a reserved gap reads as something
 *   that failed to load. The vertical padding only separates a banner that DID
 *   arrive from the content around it, and collapses to nothing with it.
 * - **One report per session, not one per failure.** On the web the usual cause
 *   is a content blocker, which is neither actionable nor rare; reporting every
 *   mount would drown the crash report in it while telling us nothing the first
 *   one did not.
 */
export const WebBannerAd = ({ slotId, accessibilityLabel }: WebBannerAdProps): React.JSX.Element | null => {
  const hostRef = useRef<View | null>(null);

  useEffect(() => {
    const node = hostRef.current;
    // On web a View ref IS the DOM node; the guard both proves that to
    // TypeScript and skips the (impossible) non-element case.
    if (node === null || !(node instanceof HTMLElement) || slotId === CharConstants.empty) return;

    void mountAdsenseUnit(node, slotId).catch((error: Error) => {
      if (reported) return;
      reported = true;
      FailureReporter.report(
        new UnknownFailure(DiagnosticMessage.ads.bannerFailed(error.message)),
        'WebBannerAd.load',
      );
    });

    return () => node.replaceChildren();
  }, [slotId]);

  if (slotId === CharConstants.empty) return null;

  return <View ref={hostRef} style={styles.slot} accessibilityLabel={accessibilityLabel} />;
};

const styles = StyleSheet.create({
  slot: {
    paddingVertical: spacing.sm,
  },
});
