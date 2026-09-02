import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import { UnknownFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { spacing, fontSizes, letterSpacings } from '@presentation/base/theme';
import { mountAdsenseUnit } from '@presentation/base/widgets/ads/mount-adsense-unit.web';
import { isFilledAdUnit } from '@presentation/base/widgets/ads/is-filled-ad-unit.web';
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
 * - **The label appears only once an ad did.** An ad has to be
 *   distinguishable from the content around it, and "Advertisement" is one of
 *   the two wordings AdSense permits — but a label over a collapsed unit
 *   labels nothing, and on a page whose whole problem was ads in the wrong
 *   place, an "Advertisement" heading with no ad under it is the worst
 *   possible thing to print. AdSense marks the element `data-ad-status`, so
 *   the label waits for `filled` and an unfilled unit stays invisible, exactly
 *   as it does today.
 */
export const WebBannerAd = ({ slotId, accessibilityLabel }: WebBannerAdProps): React.JSX.Element | null => {
  const hostRef = useRef<View | null>(null);

  const [filled, setFilled] = useState(false);
  const colors = useTheme().colors;

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
    // calling anything back, so watching the attribute is the only way to
    // learn whether an ad arrived.
    const observer = new MutationObserver(() => setFilled(isFilledAdUnit(node)));
    observer.observe(node, { subtree: true, attributes: true, attributeFilter: [AD_STATUS_ATTRIBUTE] });

    return () => {
      observer.disconnect();
      node.replaceChildren();
    };
  }, [slotId]);

  if (slotId === CharConstants.empty) return null;

  return (
    <View style={styles.slot} accessibilityLabel={accessibilityLabel}>
      {filled ? (
        <ThemedText style={[styles.label, { color: colors.textMuted }]}>
          {t().createRecipe.adLabel}
        </ThemedText>
      ) : null}
      <View ref={hostRef} />
    </View>
  );
};

/** The attribute AdSense writes its verdict into; the only one worth waking for. */
const AD_STATUS_ATTRIBUTE = 'data-ad-status';

const styles = StyleSheet.create({
  slot: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.micro,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase',
  },
});
