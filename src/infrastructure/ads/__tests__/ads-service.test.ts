import { AdsService } from '@infrastructure/ads/ads-service';

const mockGatherConsent = jest.fn();
const mockGetConsentInfo = jest.fn();
const mockInitialize = jest.fn();

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: mockInitialize }),
  AdsConsent: {
    gatherConsent: () => mockGatherConsent(),
    getConsentInfo: () => mockGetConsentInfo(),
  },
}));

jest.mock('@infrastructure/firebase/crashlytics-service', () => ({
  recordCrash: jest.fn(),
}));

describe('AdsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitialize.mockResolvedValue([]);
  });

  it('starts the SDK once consent allows it', async () => {
    mockGatherConsent.mockResolvedValue({ canRequestAds: true });

    await expect(new AdsService().prepare()).resolves.toBe(true);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  // --- regression: the production build showed no ad slot anywhere and AdMob
  // counted zero requests, with nothing on the device saying why. A consent
  // gather that THREW was cached as a session-long `false`, identical to a user
  // refusing — so one transient failure at launch silenced every slot for the
  // rest of the session, and every later mount read the cached answer instead
  // of asking again.
  it('asks again after a consent gather that could not run', async () => {
    mockGatherConsent.mockRejectedValueOnce(new Error('consent backend unreachable'));
    mockGetConsentInfo.mockResolvedValueOnce({ canRequestAds: false });
    const service = new AdsService();

    await expect(service.prepare()).resolves.toBe(false);

    mockGatherConsent.mockResolvedValueOnce({ canRequestAds: true });
    await expect(service.prepare()).resolves.toBe(true);
    expect(mockGatherConsent).toHaveBeenCalledTimes(2);
  });

  it('falls back to the consent already stored on the device', async () => {
    mockGatherConsent.mockRejectedValue(new Error('offline'));
    mockGetConsentInfo.mockResolvedValue({ canRequestAds: true });

    await expect(new AdsService().prepare()).resolves.toBe(true);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  // The other half of the same distinction: a refusal the flow actually
  // RETURNED is an answer, so it is cached — re-running a form the user just
  // dismissed on every slot mount would be the worse bug.
  it('does not re-run the flow after the user refuses', async () => {
    mockGatherConsent.mockResolvedValue({ canRequestAds: false });
    const service = new AdsService();

    await expect(service.prepare()).resolves.toBe(false);
    await expect(service.prepare()).resolves.toBe(false);
    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('reports the reason the SDK could not start', async () => {
    mockGatherConsent.mockResolvedValue({ canRequestAds: true });
    mockInitialize.mockRejectedValue(new Error('invalid application id'));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { recordCrash } = require('@infrastructure/firebase/crashlytics-service') as {
      recordCrash: jest.Mock;
    };

    await expect(new AdsService().prepare()).resolves.toBe(false);
    expect(recordCrash).toHaveBeenCalledWith(expect.any(Error), 'AdsService.initialize');
  });
});
