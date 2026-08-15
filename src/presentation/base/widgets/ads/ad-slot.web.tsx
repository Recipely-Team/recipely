import type { AdSlotProps } from '@presentation/base/widgets/ads/ad-slot-props';

/**
 * Web build of the ad slot: nothing, and no SDK import.
 *
 * @remarks
 * - **The point is the import, not the render.** `AdsService` already answers
 *   `false` on the web, so the native slot rendered nothing there anyway — but
 *   it still imported `react-native-google-mobile-ads` at module scope, and
 *   that package reaches `codegenNativeComponent`, which has no web target. The
 *   static export does not degrade on a native-only module, it fails, so the
 *   whole dev deploy went down with it. A file the web resolver picks first is
 *   what keeps the SDK out of that bundle.
 * - **Deliberately not a placeholder.** The web shell serves no ads at all, so
 *   there is nothing to reserve space for.
 */
export const AdSlot = (_props: AdSlotProps): React.JSX.Element | null => null;
