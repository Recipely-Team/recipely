import { webFeedSlotId } from '@infrastructure/constants/ads';
import { WebBannerAd } from '@presentation/base/widgets/ads/web-banner-ad';
import type { AdSlotProps } from '@presentation/base/widgets/ads/ad-slot-props';

/**
 * Web build of the ad slot: the AdSense unit that stands in for the AdMob
 * banner. **See `ad-slot.tsx`** for the native one.
 *
 * @remarks
 * - **The point is still the import.** `react-native-google-mobile-ads` reaches
 *   `codegenNativeComponent`, which has no web target — a static export does
 *   not degrade on a native-only module, it fails, and the whole dev deploy
 *   went down with it once. A file the web resolver picks first is what keeps
 *   that SDK out of this bundle; `unitId` is an AdMob id and is meaningless
 *   here, so it is dropped rather than passed on.
 * - **Same placement, different seller.** AdMob sells the apps and AdSense
 *   sells the site, but the rule about WHERE a banner may sit is one rule: this
 *   renders only where `AdSlot` already renders, which `check:structure` rule T
 *   holds to the feed.
 */
export const AdSlot = ({ accessibilityLabel }: AdSlotProps): React.JSX.Element | null => (
  <WebBannerAd slotId={webFeedSlotId()} accessibilityLabel={accessibilityLabel} />
);
