import { AdUnitStatus } from '@presentation/base/widgets/ads/ad-unit-status';

/** The element `mountAdsenseUnit` appends into a host. */
const AD_UNIT_SELECTOR = 'ins.adsbygoogle';

/**
 * AdSense's verdict on the unit inside `host`, or `null` while it has none.
 *
 * @remarks
 * - **AdSense reports by attribute, not by callback.** It writes
 *   `data-ad-status` onto the `<ins>` it decided about and calls nothing back,
 *   so reading the element is the only way to know.
 * - **Absent is not an answer.** Before AdSense has decided, the attribute is
 *   not there at all. Treating that as filled would print an "Advertisement"
 *   heading over an empty space on every page load; treating it as unfilled
 *   would collapse the unit before AdSense could measure the width it is
 *   allowed. `null` is the state where the right thing to do is nothing.
 * - **A pure function so it can be tested.** The component around it lives in
 *   `.web.tsx` and needs a DOM plus react-native-web to render; this needs a
 *   document and nothing else.
 */
export const readAdUnitStatus = (host: HTMLElement): AdUnitStatus | null => {
  const unit = host.querySelector(AD_UNIT_SELECTOR);
  if (!(unit instanceof HTMLElement)) return null;
  const status = unit.dataset.adStatus;
  return status === AdUnitStatus.Filled || status === AdUnitStatus.Unfilled ? status : null;
};
