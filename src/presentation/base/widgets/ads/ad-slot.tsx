import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAdsReady } from '@presentation/base/hooks/ads/use-ads-ready';
import { spacing } from '@presentation/base/theme';

export interface AdSlotProps {
  /** AdMob ad unit id for this placement. */
  unitId: string;
  /** Read by a screen reader in place of the ad's own content. */
  accessibilityLabel: string;
}

/**
 * One banner, or nothing at all.
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
 */
export const AdSlot = ({ unitId, accessibilityLabel }: AdSlotProps): React.JSX.Element | null => {
  const ready = useAdsReady();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

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
        onAdFailedToLoad={() => setFailed(true)}
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
