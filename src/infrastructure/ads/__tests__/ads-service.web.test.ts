/**
 * Contract test for the web `AdsService`.
 *
 * `prepare` answers one question — may an ad be requested at all — and on the
 * web that is whether the deploy was given an AdSense unit. It used to answer
 * `false` unconditionally, which was right while the site served no ads and
 * wrong the moment it did: the feed builds no ad rows for a slot to fill.
 */
import { AdsService } from '@infrastructure/ads/ads-service.web';

describe('AdsService (web)', () => {
  const original = process.env.EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID;

  afterEach(() => {
    process.env.EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID = original;
  });

  it('allows a request once a unit is configured', async () => {
    process.env.EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID = '1234567890';

    await expect(new AdsService().prepare()).resolves.toBe(true);
  });

  it('allows nothing when the deploy never received a unit', async () => {
    delete process.env.EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID;

    await expect(new AdsService().prepare()).resolves.toBe(false);
  });

  // CI hands an undeclared secret over as an EMPTY STRING, not as undefined —
  // a unit id of '' requests nothing and reports nothing, which from the
  // outside looks exactly like ads that "do not fill".
  it('treats a blank unit as no unit at all', async () => {
    process.env.EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID = '   ';

    await expect(new AdsService().prepare()).resolves.toBe(false);
  });
});
