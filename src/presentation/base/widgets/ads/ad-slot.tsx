import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAdsReady } from '@presentation/base/hooks/ads/use-ads-ready';
import { spacing } from '@presentation/base/theme';
import type { AdSlotProps } from '@presentation/base/widgets/ads/ad-slot-props';
import { UnknownFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';

/** Units whose failure has already been reported once this session. */
const reported = new Set<string>();

/**
 * One banner, or nothing at all. **Native build** — see `ad-slot.web.tsx`.
 *
 * @remarks
 * - **Nothing is the default, and failure returns to it.** The slot occupies no
 *   space until an ad has actually loaded, and gives the space back if one
 *   fails — a reserved empty box is a hole in the layout that says an ad should
 *   have been there, which is worse for the reader than no ad.
 * - **The banner is anchored, never inserted mid-content.** It is a row of a
 *   list or a strip under a finished checklist, so nothing the user was reading
 *   moves when it appears.
 * - **`ANCHORED_ADAPTIVE_BANNER`, not a fixed size.** It asks for a height
 *   suited to the device width instead of a 320×50 rectangle stretched or
 *   letterboxed on everything from a small phone to a tablet.
 * - **The SSP's reason is kept, not thrown away.** `onAdFailedToLoad` used to
 *   be `() => setFailed(true)`, which collapsed every cause into the same empty
 *   space: a brand-new unit with no inventory (code 3, "no fill") looked
 *   exactly like a unit id that does not exist or an app id the manifest never
 *   received (code 1, "invalid request"). Rendering nothing is still right —
 *   the reason belongs in the crash report, not on the screen.
 * - **Once per unit per session.** A feed shows a banner every ten rows, so
 *   reporting each failure would file the same report dozens of times in one
 *   scroll. The first one carries the whole message; the rest add nothing.
 */
export const AdSlot = ({ unitId, accessibilityLabel }: AdSlotProps): React.JSX.Element | null => {
  const ready = useAdsReady();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onFailed = useCallback(
    (error: Error): void => {
      setFailed(true);
      if (reported.has(unitId)) return;
      reported.add(unitId);
      FailureReporter.report(
        new UnknownFailure(DiagnosticMessage.ads.bannerFailed(error.message)),
        'AdSlot.load',
      );
    },
    [unitId],
  );

  if (!ready || failed) return null;

  return (
    <View
      style={loaded ? styles.slot : styles.pending}
      accessible={loaded}
      accessibilityLabel={accessibilityLabel}
    >
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={onFailed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  // Mounted but not yet loaded: the banner must be in the tree to request an
  // ad, while taking up no room until it has one to show.
  pending: {
    height: 0,
    overflow: 'hidden',
  },
});
