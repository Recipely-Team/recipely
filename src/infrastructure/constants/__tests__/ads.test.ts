/**
 * Which ad unit a build ends up requesting.
 *
 * Two things worth pinning:
 *
 * - **The blank one.** These values come from CI, where an *undeclared secret
 *   arrives as an empty string* rather than as undefined — so
 *   `process.env.X ?? TEST_UNIT` keeps the empty string and the release ships a
 *   unit id of `''`. Nothing throws: the request is simply never filled, which
 *   from the outside is indistinguishable from ads that do not sell.
 * - **The platform one.** AdMob issues unit ids per app, and iOS and Android
 *   are two apps. Serving one platform's unit to the other never fills, and
 *   reports against the wrong app when it does — a mistake that pays nothing
 *   and looks like nothing.
 */

import { feedBannerUnitId } from '@infrastructure/constants/ads';
import { isIos } from '@infrastructure/constants/platform';

// The unit is chosen by a predicate, not by a frozen module-level read, so the
// platform is stubbed at the seam instead of by mutating `Platform.OS` — which
// is a getter on the RN mock and silently ignores assignment. An earlier
// version of this test did exactly that and passed against code that ignored
// the platform entirely.
jest.mock('@infrastructure/constants/platform', () => ({
  isIos: jest.fn(() => false),
  isAndroid: jest.fn(() => true),
  isWeb: jest.fn(() => false),
}));

const onPlatform = (os: 'ios' | 'android'): void => {
  (isIos as jest.Mock).mockReturnValue(os === 'ios');
};

const TEST_UNIT = 'ca-app-pub-3940256099942544/6300978111';
const IOS_UNIT = 'ca-app-pub-1234567890123456/1111111111';
const ANDROID_UNIT = 'ca-app-pub-1234567890123456/2222222222';

/** Sets or clears both platforms' vars, then reads the unit as `os` would. */
const feedUnitId = (
  os: 'ios' | 'android',
  configured: { ios?: string; android?: string },
): string => {
  // Literal access, not `process.env[name]`: expo/no-dynamic-env-var exists
  // because the bundler inlines these by name and cannot follow a variable.
  if (configured.ios === undefined) delete process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID;
  else process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID = configured.ios;

  if (configured.android === undefined)
    delete process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID;
  else process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID = configured.android;

  onPlatform(os);
  return feedBannerUnitId();
};

const BOTH = { ios: IOS_UNIT, android: ANDROID_UNIT };

describe('the feed ad unit', () => {
  const originalIos = process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID;
  const originalAndroid = process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID;

  afterAll(() => {
    if (originalIos === undefined) delete process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID;
    else process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID = originalIos;

    if (originalAndroid === undefined)
      delete process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID;
    else process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID = originalAndroid;
  });

  it('serves each platform its own app’s unit', () => {
    expect(feedUnitId('ios', BOTH)).toBe(IOS_UNIT);
    expect(feedUnitId('android', BOTH)).toBe(ANDROID_UNIT);
  });

  it('never borrows the other platform’s unit when its own is missing', () => {
    // The tempting fallback, and the wrong one: it would request an id that
    // belongs to a different AdMob app, which fills nothing and reports nowhere.
    expect(feedUnitId('ios', { android: ANDROID_UNIT })).toBe(TEST_UNIT);
    expect(feedUnitId('android', { ios: IOS_UNIT })).toBe(TEST_UNIT);
  });

  it('falls back to the test unit when nothing is configured', () => {
    expect(feedUnitId('ios', {})).toBe(TEST_UNIT);
    expect(feedUnitId('android', {})).toBe(TEST_UNIT);
  });

  it('treats an undeclared CI secret — an empty string — as nothing configured', () => {
    expect(feedUnitId('ios', { ios: '' })).toBe(TEST_UNIT);
    expect(feedUnitId('android', { android: '' })).toBe(TEST_UNIT);
  });

  it('treats whitespace as nothing configured too', () => {
    // A secret pasted with a trailing newline is the same mistake wearing a hat.
    expect(feedUnitId('android', { android: '  ' })).toBe(TEST_UNIT);
  });
});
