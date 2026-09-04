import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import { UnknownFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { spacing } from '@presentation/base/theme';
import { mountAdsenseUnit } from '@presentation/base/widgets/ads/mount-adsense-unit.web';
import { readAdUnitStatus } from '@presentation/base/widgets/ads/read-ad-unit-status.web';
import { AdUnitStatus } from '@presentation/base/widgets/ads/ad-unit-status';
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
 * - **An unfilled unit is collapsed, and it takes collapsing to do it.** This
 *   component reserves nothing — no `minHeight`, and the padding belongs to a
 *   banner that arrived — but the space was never ours to withhold: AdSense
 *   writes `height: 280px` INLINE onto its own `<ins>` when the unit is
 *   requested, and leaves it there after answering `unfilled`. So the feed
 *   carried a 296px hole between the cuisine rail and the grid for every
 *   viewer, on the one page whose emptiness is the thing under review. The
 *   wrapper is hidden once AdSense itself has said `unfilled`; nothing is
 *   hidden before the verdict, because the unit must be laid out at its real
 *   width for AdSense to measure it, and a served ad is never touched.
 * - **One report per session, not one per failure.** On the web the usual cause
 *   is a content blocker, which is neither actionable nor rare; reporting every
 *   mount would drown the crash report in it while telling us nothing the first
 *   one did not.
 * - **The label appears only once an ad did.** An ad has to be
 *   distinguishable from the content around it, and "Advertisement" is one of
 *   the two wordings AdSense permits — but a label over a collapsed unit
 *   labels nothing, and on a page whose whole problem was ads in the wrong
 *   place, an "Advertisement" heading with no ad under it is the worst
 *   possible thing to print.
 */
export const WebBannerAd = ({ slotId, accessibilityLabel }: WebBannerAdProps): React.JSX.Element | null => {
  const hostRef = useRef<View | null>(null);

  const [status, setStatus] = useState<AdUnitStatus | null>(null);

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

    // AdSense writes the verdict onto the element it was given rather than
    // calling anything back, so watching the subtree is the only way to learn
    // whether an ad arrived. No `attributeFilter`: naming the attribute here
    // as well would spell the same vocabulary in two files that must agree,
    // and `readAdUnitStatus` is the one that decides what counts. The host
    // holds a single `<ins>`, so there is nothing to be noisy about.
    const observer = new MutationObserver(() => setStatus(readAdUnitStatus(node)));
    observer.observe(node, { subtree: true, attributes: true });

    return () => {
      observer.disconnect();
      node.replaceChildren();
    };
  }, [slotId]);

  if (slotId === CharConstants.empty) return null;

  return (
    <View
      style={status === AdUnitStatus.Unfilled ? styles.collapsed : styles.slot}
      accessibilityLabel={accessibilityLabel}
    >
      {status === AdUnitStatus.Filled ? (
        <ThemedText variant="label" muted>
          {t().createRecipe.adLabel}
        </ThemedText>
      ) : null}
      <View ref={hostRef} />
    </View>
  );
};


const styles = StyleSheet.create({
  slot: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  // `display: none` rather than a zero height: the `<ins>` keeps the inline
  // height AdSense gave it, so the box has to be taken out of layout entirely
  // for the gap to close. The node stays mounted — removing it would re-request
  // an ad AdSense has already declined for this page view.
  collapsed: {
    display: 'none',
  },
});
