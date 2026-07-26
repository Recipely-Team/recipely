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
