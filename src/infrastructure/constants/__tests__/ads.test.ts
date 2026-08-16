/**
 * Which ad unit a build ends up requesting.
 *
 * The case worth pinning is the blank one. These values come from CI, where an
 * **undeclared secret arrives as an empty string** rather than as undefined —
 * so `process.env.X ?? TEST_UNIT` keeps the empty string and the release ships
 * a unit id of `''`. Nothing throws: the request is simply never filled, which
 * from the outside is indistinguishable from ads that do not sell.
 */

const TEST_UNIT = 'ca-app-pub-3940256099942544/6300978111';
const REAL_UNIT = 'ca-app-pub-1234567890123456/9876543210';

/** Re-imports the module so it re-reads `process.env` at module scope. */
const feedUnitId = (configured: string | undefined): string => {
  // Literal access, not `process.env[name]`: expo/no-dynamic-env-var exists
  // because the bundler inlines these by name and cannot follow a variable.
  if (configured === undefined) delete process.env.EXPO_PUBLIC_ADMOB_FEED_BANNER_UNIT_ID;
  else process.env.EXPO_PUBLIC_ADMOB_FEED_BANNER_UNIT_ID = configured;

  let unit = '';
  jest.isolateModules(() => {
    unit = jest.requireActual<typeof import('@infrastructure/constants/ads')>(
      '@infrastructure/constants/ads',
    ).FEED_BANNER_UNIT_ID;
  });
  return unit;
};

describe('the feed ad unit', () => {
  const original = process.env.EXPO_PUBLIC_ADMOB_FEED_BANNER_UNIT_ID;

  afterAll(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_ADMOB_FEED_BANNER_UNIT_ID;
    else process.env.EXPO_PUBLIC_ADMOB_FEED_BANNER_UNIT_ID = original;
  });

  it('uses the configured unit when the build supplies one', () => {
    expect(feedUnitId(REAL_UNIT)).toBe(REAL_UNIT);
  });

  it('falls back to the test unit when nothing is configured', () => {
    expect(feedUnitId(undefined)).toBe(TEST_UNIT);
  });

  it('treats an undeclared CI secret — an empty string — as nothing configured', () => {
    expect(feedUnitId('')).toBe(TEST_UNIT);
  });

  it('treats whitespace as nothing configured too', () => {
    // A secret pasted with a trailing newline is the same mistake wearing a hat.
    expect(feedUnitId('  ')).toBe(TEST_UNIT);
  });
});
