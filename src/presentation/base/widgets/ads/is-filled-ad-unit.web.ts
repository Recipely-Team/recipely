/** The element `mountAdsenseUnit` appends into a host. */
const AD_UNIT_SELECTOR = 'ins.adsbygoogle';
/** AdSense's own verdict, written onto that element once it has decided. */
const AD_STATUS_FILLED = 'filled';

/**
 * Whether the unit inside `host` actually received an ad.
 *
 * @remarks
 * - **AdSense reports by attribute, not by callback.** It writes
 *   `data-ad-status` onto the `<ins>` it filled — `filled` or `unfilled` — and
 *   calls nothing back, so reading the element is the only way to know.
 * - **Absent is not filled.** Before AdSense has decided, the attribute is not
 *   there at all; treating that as filled would print an "Advertisement"
 *   heading over an empty space on every page load, which on this site is the
 *   opposite of the thing the label exists to do.
 * - **A pure function so it can be tested.** The component around it lives in
 *   `.web.tsx` and needs a DOM plus react-native-web to render; this needs a
 *   document and nothing else.
 */
export const isFilledAdUnit = (host: HTMLElement): boolean => {
  const unit = host.querySelector(AD_UNIT_SELECTOR);
  return unit instanceof HTMLElement && unit.dataset.adStatus === AD_STATUS_FILLED;
};
