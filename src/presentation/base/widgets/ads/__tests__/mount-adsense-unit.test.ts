/**
 * @jest-environment jsdom
 */
/**
 * Unit tests for the AdSense unit mounter.
 *
 * The loader is deliberately fetched from HERE and nowhere else: it used to sit
 * in `+html.tsx`, the shell that wraps every route, which ran it on `/login`,
 * `/settings` and `/verify-code` and earned recipely.net a policy notice
 * (CLAUDE.md §23e). These pin the two things that keeps honest — the script
 * arrives with a unit, and each unit is pushed exactly once, after it loads.
 *
 * They run in order against ONE shared document on purpose: a session fetches
 * the loader once and mounts many units against it, and resetting between cases
 * would test a page that never exists.
 */
import { ADSENSE_CLIENT_ID } from '@infrastructure/constants/ads';
import { mountAdsenseUnit } from '@presentation/base/widgets/ads/mount-adsense-unit.web';

const SLOT = '1234567890';

const host = (): HTMLElement => {
  const node = document.createElement('div');
  document.body.appendChild(node);
  return node;
};

const scripts = (): HTMLScriptElement[] => [...document.head.querySelectorAll('script')];

describe('mountAdsenseUnit', () => {
  it('builds the unit up front but asks for the ad only once the loader arrives', async () => {
    const node = host();
    const mounted = mountAdsenseUnit(node, SLOT);

    // Built before the script is even asked for: `push` fills the next unfilled
    // element in the document, so the element has to be there first.
    const unit = node.querySelector('ins');
    expect(unit?.className).toBe('adsbygoogle');
    expect(unit?.dataset.adClient).toBe(ADSENSE_CLIENT_ID);
    expect(unit?.dataset.adSlot).toBe(SLOT);
    expect(unit?.dataset.adFormat).toBe('auto');
    expect(unit?.dataset.fullWidthResponsive).toBe('true');

    await Promise.resolve();
    expect(window.adsbygoogle).toBeUndefined();

    scripts()[0].onload?.(new Event('load'));
    await mounted;
    expect(window.adsbygoogle).toHaveLength(1);
  });

  it('fetches the loader for this publisher, once, however many units follow', async () => {
    await mountAdsenseUnit(host(), SLOT);

    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].getAttribute('src')).toContain(ADSENSE_CLIENT_ID);
    // One push per unit, never two for the same one — pushing again for an
    // element that already has an ad throws.
    expect(window.adsbygoogle).toHaveLength(2);
  });
});
