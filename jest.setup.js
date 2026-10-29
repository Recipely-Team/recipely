// Reanimated 4 initialises `react-native-worklets`, whose native TurboModule
// has no JS-only counterpart — since worklets 0.7 (Expo SDK 55) its constructor
// throws "Native part of Worklets doesn't seem to be initialized" the moment a
// component importing Reanimated is required, failing the whole suite before a
// single test runs. Both packages ship official mocks for exactly this; they
// render Animated components as plain views and turn animations into no-ops.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Reanimated's mock deliberately leaves this one out ("ADD ME IF NEEDED").
  // `false` is the unreduced default, matching a device without the OS
  // reduce-motion setting — which is what the suites assert against.
  useReducedMotion: () => false,
}));

// The ads SDK's entry point calls `TurboModuleRegistry.getEnforcing` at import
// time, so merely importing a screen that contains an ad slot throws before any
// test runs. The library ships a setup file for this, but it re-mocks
// `react-native` wholesale and would fight jest-expo's own preset — so the
// module is mocked directly, the way reanimated is above.
//
// `canRequestAds: false` is the deliberate default: it is the answer a user who
// declined consent gives, so every suite renders the feed WITHOUT ads and would
// notice a slot that appears regardless. The with-ads layout is covered purely
// by the `buildFeedRows` tests.
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: async () => [] }),
  BannerAd: () => null,
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  AdsConsent: {
    gatherConsent: async () => ({ canRequestAds: false }),
    // Consulted only when `gatherConsent` throws; present so the fallback path
    // is a real call rather than an `undefined is not a function`.
    getConsentInfo: async () => ({ canRequestAds: false, status: 'UNKNOWN' }),
  },
  AdsConsentStatus: {
    UNKNOWN: 'UNKNOWN',
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
    OBTAINED: 'OBTAINED',
  },
}));

// FlashList measures its viewport and rows through native layout, which the test
// renderer never reports, so it would render no rows. This is the measuring half
// of the package's own jestSetup.js (a 400×900 viewport, 100×100 rows); its other
// half swaps FlashList for a `RecyclerView` export 2.0.x does not have.
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => {
  const box = (width, height) => jest.fn(() => ({ x: 0, y: 0, width, height }));
  return {
    ...jest.requireActual('@shopify/flash-list/dist/recyclerview/utils/measureLayout'),
    measureParentSize: box(400, 900),
    measureFirstChildLayout: box(400, 900),
    measureItemLayout: box(100, 100),
  };
});
