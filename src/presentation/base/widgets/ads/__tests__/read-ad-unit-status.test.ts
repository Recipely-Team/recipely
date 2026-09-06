/**
 * @jest-environment jsdom
 */
/**
 * What decides whether the unit is labelled, collapsed, or left alone.
 *
 * @remarks
 * Two separate things ride on this verdict, and they fail in opposite
 * directions:
 *
 * - The "Advertisement" label exists because an ad has to be distinguishable
 *   from the content around it. On this site that matters more than usual: the
 *   AdSense notice recipely.net received was about ads on screens with no
 *   publisher content, so a heading standing over an empty space is the one
 *   thing worse than no label at all.
 * - The collapse exists because AdSense writes `height: 280px` inline onto its
 *   own `<ins>` when the unit is requested and leaves it there after answering
 *   `unfilled` — which left a 296px hole in the middle of the feed. Collapsing
 *   one frame too early would hide the unit before AdSense could measure the
 *   width it is allowed, and it would never fill at all.
 *
 * Both need the same third state — "has not decided" — to be distinguishable
 * from both answers, which is why this returns `null` rather than a boolean.
 * Every case below is a state a real page passes through, in order.
 */
import { readAdUnitStatus } from '@presentation/base/widgets/ads/read-ad-unit-status.web';
import { AdUnitStatus } from '@presentation/base/widgets/ads/ad-unit-status';

const hostWith = (markup: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host;
};

describe('readAdUnitStatus', () => {
  it('has no verdict before the unit has been mounted at all', () => {
    expect(readAdUnitStatus(hostWith(''))).toBeNull();
  });

  it('has no verdict while AdSense has not decided yet', () => {
    // The state every page load starts in: the element exists, the attribute
    // does not. Reading absence as an answer would either label an empty space
    // on every visit or collapse the unit before it could be filled.
    expect(readAdUnitStatus(hostWith('<ins class="adsbygoogle"></ins>'))).toBeNull();
  });

  it('reports unfilled when AdSense declined the unit', () => {
    // The state the live feed was stuck in: this is what has to collapse.
    expect(
      readAdUnitStatus(hostWith('<ins class="adsbygoogle" data-ad-status="unfilled"></ins>')),
    ).toBe(AdUnitStatus.Unfilled);
  });

  it('reports filled once an ad actually arrived', () => {
    expect(
      readAdUnitStatus(hostWith('<ins class="adsbygoogle" data-ad-status="filled"></ins>')),
    ).toBe(AdUnitStatus.Filled);
  });

  it('has no verdict for a value AdSense does not write', () => {
    // Anything but the two documented values is not an answer we can act on.
    expect(
      readAdUnitStatus(hostWith('<ins class="adsbygoogle" data-ad-status="pending"></ins>')),
    ).toBeNull();
  });

  it('ignores an element that is not the ad unit', () => {
    // The host is a React-owned container; anything else inside it is ours,
    // and none of it is evidence about an ad.
    expect(readAdUnitStatus(hostWith('<div data-ad-status="filled"></div>'))).toBeNull();
  });
});
