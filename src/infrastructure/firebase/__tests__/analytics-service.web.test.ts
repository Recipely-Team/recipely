/**
 * Contract test for the WEB half of the analytics pair.
 *
 * Jest resolves the native file everywhere else, so this suite imports the
 * `.web` module by its explicit path — the same way `kv-store.web` and
 * `ads-service.web` are covered. It is the half carrying the logic a reader
 * cannot verify by eye: the JS SDK spells screen-view parameters
 * `firebase_screen` / `firebase_screen_class`, and getting them wrong shows
 * `(not set)` in the console with no error raised anywhere.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

let mockApp: object | null = { name: 'app' };
let mockSupported = true;

jest.mock('@infrastructure/firebase/firebase-init', () => ({
  getFirebaseApp: jest.fn(() => mockApp),
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({ id: 'analytics' })),
  isSupported: jest.fn(async () => mockSupported),
  logEvent: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
}));

import { getAnalytics, isSupported, logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics';

const ANALYTICS = { id: 'analytics' };

/** Fresh module per test: the service memoises its handle and its gate. */
const loadService = async (): Promise<
  typeof import('@infrastructure/firebase/analytics-service.web')['analyticsService']
> => {
  let service!: Awaited<ReturnType<typeof loadService>>;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    service = require('@infrastructure/firebase/analytics-service.web').analyticsService;
  });
  return service;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApp = { name: 'app' };
  mockSupported = true;
});

describe('analyticsService (web)', () => {
  it('reports a screen under the JS SDK parameter names', async () => {
    const service = await loadService();
    await service.setEnabled(true);

    await service.logScreen('RecipeListScreen');

    expect(logEvent).toHaveBeenCalledWith(ANALYTICS, 'screen_view', {
      firebase_screen: 'RecipeListScreen',
      firebase_screen_class: 'RecipeListScreen',
    });
  });

  it('uses an explicit screen class when given one', async () => {
    const service = await loadService();
    await service.setEnabled(true);

    await service.logScreen('Detail', 'RecipeDetailScreen');

    expect(logEvent).toHaveBeenCalledWith(ANALYTICS, 'screen_view', {
      firebase_screen: 'Detail',
      firebase_screen_class: 'RecipeDetailScreen',
    });
  });

  it('forwards a custom event with its params', async () => {
    const service = await loadService();
    await service.setEnabled(true);

    await service.logEvent('failure_shown', { code: 'network', context: 'feed' });

    expect(logEvent).toHaveBeenCalledWith(ANALYTICS, 'failure_shown', {
      code: 'network',
      context: 'feed',
    });
  });

  // The bug this guards: `getAnalytics` is what boots gtag, and gtag reports a
  // page_view of its own the moment it loads. A development session must not
  // reach it at all — switching collection off afterwards is already too late.
  it('boots nothing at all until collection has been enabled', async () => {
    const service = await loadService();

    await service.logScreen('SettingsScreen');

    expect(getAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('stops reporting once collection is switched off', async () => {
    const service = await loadService();
    await service.setEnabled(true);
    await service.setEnabled(false);

    await service.logScreen('SettingsScreen');

    expect(setAnalyticsCollectionEnabled).toHaveBeenLastCalledWith(ANALYTICS, false);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('stays silent when the build was never given a Firebase config', async () => {
    mockApp = null;
    const service = await loadService();
    await service.setEnabled(true);

    await service.logScreen('RecipeListScreen');

    expect(getAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  // Some embedded webviews answer `false`, and the static export runs under
  // Node where there is no `window`. Neither may throw, and neither should be
  // asked again on every navigation.
  it('asks an unsupported browser once and then leaves it alone', async () => {
    mockSupported = false;
    const service = await loadService();
    await service.setEnabled(true);

    await service.logScreen('RecipeListScreen');
    await service.logScreen('SettingsScreen');

    expect(isSupported).toHaveBeenCalledTimes(1);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('swallows a throwing SDK', async () => {
    jest.mocked(getAnalytics).mockImplementationOnce(() => {
      throw new Error('no window');
    });
    const service = await loadService();

    await expect(service.setEnabled(true)).resolves.not.toThrow();
    await expect(service.logScreen('RecipeListScreen')).resolves.not.toThrow();
  });
});
