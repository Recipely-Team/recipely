import type { WebBannerAdProps } from '@presentation/base/widgets/ads/web-banner-ad-props';

/**
 * Native build of the web banner: nothing, and no DOM.
 *
 * The app sells its native inventory through AdMob (`AdSlot`), which is a
 * different product with different unit ids and its own SDK. This file exists
 * so the web unit can be placed in shared feed code without every native screen
 * having to ask which platform it is on.
 */
export const WebBannerAd = (_props: WebBannerAdProps): React.JSX.Element | null => null;
