/**
 * @jest-environment jsdom
 */
/**
 * What decides whether the "Advertisement" label is printed.
 *
 * @remarks
 * The label exists because an ad has to be distinguishable from the content
 * around it. On this site that matters more than usual: the AdSense notice
 * recipely.net received was about ads on screens with no publisher content, so
 * an "Advertisement" heading standing over an empty space — which is what an
 * unfilled unit leaves behind — is the one thing worse than no label at all.
 *
 * AdSense reports its verdict by writing `data-ad-status` onto the `<ins>` and
 * calling nothing back, and the attribute is ABSENT until it has decided. Every
 * case below is a state a real page passes through in order.
 */
import { isFilledAdUnit } from '@presentation/base/widgets/ads/is-filled-ad-unit.web';

const hostWith = (markup: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host;
};

describe('isFilledAdUnit', () => {
  it('is false before the unit has been mounted at all', () => {
    expect(isFilledAdUnit(hostWith(''))).toBe(false);
  });

  it('is false while AdSense has not decided yet', () => {
    // The state every page load starts in: the element exists, the attribute
    // does not. Reading absence as "filled" would label an empty space on
    // every single visit.
    expect(isFilledAdUnit(hostWith('<ins class="adsbygoogle"></ins>'))).toBe(false);
  });

  it('is false when AdSense declined to fill the unit', () => {
    expect(
      isFilledAdUnit(hostWith('<ins class="adsbygoogle" data-ad-status="unfilled"></ins>')),
    ).toBe(false);
  });

  it('is true once an ad actually arrived', () => {
    expect(
      isFilledAdUnit(hostWith('<ins class="adsbygoogle" data-ad-status="filled"></ins>')),
    ).toBe(true);
  });

  it('ignores an element that is not the ad unit', () => {
    // The host is a React-owned container; anything else inside it is ours,
    // and none of it is evidence that an ad was served.
    expect(isFilledAdUnit(hostWith('<div data-ad-status="filled"></div>'))).toBe(false);
  });
});
