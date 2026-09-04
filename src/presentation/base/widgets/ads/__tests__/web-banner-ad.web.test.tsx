/**
 * @jest-environment jsdom
 */
/**
 * The feed carried a 296px hole where an ad was not.
 *
 * `WebBannerAd` reserves nothing of its own — no `minHeight`, and its padding
 * belongs to a banner that arrived. That was never the whole story: AdSense
 * writes `height: 280px` INLINE onto its own `<ins>` when the unit is
 * requested, and leaves it there after answering `unfilled`. So on the live
 * feed, between the cuisine rail and the recipe grid, every viewer got an
 * empty block on the one page whose emptiness is the thing under review.
 *
 * These render through react-dom rather than the react-test-renderer helper
 * the sibling suites use, because the behaviour under test IS the DOM: the
 * component's effect returns early unless its `View` ref is a real
 * `HTMLElement`, and the verdict arrives through a `MutationObserver`.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
// jest-expo resolves `react-native` to the native build, which renders a
// literal <View> element in jsdom. The component under test is the WEB half of
// a platform pair, so it must be rendered by the web implementation.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- a jest.mock factory is hoisted above imports and can only require
jest.mock('react-native', () => require('react-native-web'));

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { WebBannerAd } from '@presentation/base/widgets/ads/web-banner-ad.web';

/** Stands in for the real loader: appends the `<ins>` and nothing else. */
jest.mock('@presentation/base/widgets/ads/mount-adsense-unit.web', () => ({
  mountAdsenseUnit: jest.fn(async (host: HTMLElement) => {
    // `host.ownerDocument`, not the global: a `jest.mock` factory may not
    // close over out-of-scope variables.
    const unit = host.ownerDocument.createElement('ins');
    unit.className = 'adsbygoogle';
    // The inline height AdSense really sets, which is the whole defect.
    unit.style.height = '280px';
    host.appendChild(unit);
  }),
}));

const SLOT_ID = '1234567890';

/** The element the component wraps its host in — the box that must collapse. */
const wrapperOf = (container: HTMLElement): HTMLElement => {
  const wrapper = container.firstElementChild;
  if (!(wrapper instanceof HTMLElement)) throw new Error('the banner rendered no wrapper');
  return wrapper;
};

/**
 * The wrapper's effective `display`.
 *
 * Read computed, never `style.display`: react-native-web compiles styles to
 * atomic CSS classes rather than inline declarations, so the inline property
 * is empty however the box is laid out — an assertion on it passes whether the
 * unit collapsed or not, which is the shape of a test that documents nothing.
 */
const displayOf = (element: HTMLElement): string => getComputedStyle(element).display;

const unitOf = (container: HTMLElement): HTMLElement => {
  const unit = container.querySelector('ins.adsbygoogle');
  if (!(unit instanceof HTMLElement)) throw new Error('the loader appended no unit');
  return unit;
};

/** Lets the mocked mount resolve and the MutationObserver deliver its records. */
const settle = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

const mount = async (container: HTMLElement, slotId = SLOT_ID): Promise<void> => {
  const root = createRoot(container);
  await act(async () => {
    root.render(<WebBannerAd slotId={slotId} accessibilityLabel="Advertisement" />);
  });
  await settle();
};

describe('WebBannerAd', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('leaves the unit in layout while AdSense has not decided', async () => {
    // Collapsing before the verdict would hide the unit before AdSense could
    // measure the width it is allowed, and it would never fill at all.
    await mount(container);

    expect(displayOf(wrapperOf(container))).not.toBe('none');
  });

  it('collapses the box once AdSense answers unfilled', async () => {
    await mount(container);

    await act(async () => {
      unitOf(container).setAttribute('data-ad-status', 'unfilled');
      await Promise.resolve();
    });

    // Not merely "no padding": the `<ins>` keeps its inline 280px, so the box
    // has to leave layout entirely for the gap in the feed to close.
    expect(displayOf(wrapperOf(container))).toBe('none');
  });

  it('keeps the unit mounted when it collapses', async () => {
    // Removing the element would re-request an ad AdSense has already
    // declined for this page view.
    await mount(container);

    await act(async () => {
      unitOf(container).setAttribute('data-ad-status', 'unfilled');
      await Promise.resolve();
    });

    expect(container.querySelector('ins.adsbygoogle')).not.toBeNull();
  });

  it('shows a served ad, and labels it', async () => {
    await mount(container);

    await act(async () => {
      unitOf(container).setAttribute('data-ad-status', 'filled');
      await Promise.resolve();
    });

    expect(displayOf(wrapperOf(container))).not.toBe('none');
    expect(container.textContent).not.toBe('');
  });

  it('renders nothing at all without a slot id', async () => {
    // A deploy that never received the id shows no box, not an empty one.
    await mount(container, '');

    expect(container.innerHTML).toBe('');
  });
});
