import { AdsService } from "@infrastructure/ads/ads-service";
import { recordCrash } from "@infrastructure/firebase/crashlytics-service";

const mockGatherConsent = jest.fn();
const mockGetConsentInfo = jest.fn();
const mockInitialize = jest.fn();

jest.mock("react-native-google-mobile-ads", () => ({
  __esModule: true,
  default: () => ({ initialize: mockInitialize }),
  AdsConsent: {
    gatherConsent: () => mockGatherConsent(),
    getConsentInfo: () => mockGetConsentInfo(),
  },
  AdsConsentStatus: {
    UNKNOWN: "UNKNOWN",
    REQUIRED: "REQUIRED",
    NOT_REQUIRED: "NOT_REQUIRED",
    OBTAINED: "OBTAINED",
  },
}));

jest.mock("@infrastructure/firebase/crashlytics-service", () => ({
  recordCrash: jest.fn(),
}));

const crashed = jest.mocked(recordCrash);

/** A device that has never been through the consent form. */
const NOT_ASKED = { canRequestAds: false, status: "UNKNOWN" };
/** A device whose user went through the form and declined. */
const DECLINED = { canRequestAds: false, status: "OBTAINED" };

describe("AdsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitialize.mockResolvedValue([]);
  });

  it("starts the SDK once consent allows it", async () => {
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
  it("asks again after a consent gather that could not run", async () => {
    mockGatherConsent.mockRejectedValueOnce(
      new Error("consent backend unreachable"),
    );
    mockGetConsentInfo.mockResolvedValueOnce(NOT_ASKED);
    const service = new AdsService();

    await expect(service.prepare()).resolves.toBe(false);

    mockGatherConsent.mockResolvedValueOnce({ canRequestAds: true });
    await expect(service.prepare()).resolves.toBe(true);
    expect(mockGatherConsent).toHaveBeenCalledTimes(2);
  });

  // The retry has to be bounded: `prepare` runs on every `AdSlot` mount, and a
  // slot is a FlatList row that remounts each time it scrolls back into view.
  // Unbounded, an offline device fires a native consent call per row.
  it("stops asking after three attempts that reach no answer", async () => {
    mockGatherConsent.mockRejectedValue(new Error("offline"));
    mockGetConsentInfo.mockResolvedValue(NOT_ASKED);
    const service = new AdsService();

    for (let i = 0; i < 10; i++) await service.prepare();

    expect(mockGatherConsent).toHaveBeenCalledTimes(3);
  });

  // ...and so is the reporting the retry fires, for the same reason.
  it("reports each failing step once per session", async () => {
    mockGatherConsent.mockRejectedValue(new Error("offline"));
    mockGetConsentInfo.mockResolvedValue(NOT_ASKED);
    const service = new AdsService();

    for (let i = 0; i < 10; i++) await service.prepare();

    expect(crashed).toHaveBeenCalledTimes(1);
    expect(crashed).toHaveBeenCalledWith(
      expect.any(Error),
      "AdsService.gatherConsent",
    );
  });

  it("falls back to the consent already stored on the device", async () => {
    mockGatherConsent.mockRejectedValue(new Error("offline"));
    mockGetConsentInfo.mockResolvedValue({
      canRequestAds: true,
      status: "OBTAINED",
    });

    await expect(new AdsService().prepare()).resolves.toBe(true);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  // The other half of the same distinction: a refusal the flow actually
  // RETURNED is an answer, so it is cached — re-running a form the user just
  // dismissed on every slot mount would be the worse bug.
  it("does not re-run the flow after the user refuses", async () => {
    mockGatherConsent.mockResolvedValue({ canRequestAds: false });
    const service = new AdsService();

    await expect(service.prepare()).resolves.toBe(false);
    await expect(service.prepare()).resolves.toBe(false);
    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  // A stored refusal is just as final as a fresh one — but a device that has
  // never SEEN the form reports the same `canRequestAds: false`, and only its
  // status tells the two apart. Reading the flag alone would have made a first
  // launch that merely happened to be offline permanently silent.
  it("treats a stored refusal as final and a stored blank as retryable", async () => {
    mockGatherConsent.mockRejectedValue(new Error("offline"));
    mockGetConsentInfo.mockResolvedValue(DECLINED);
    const refused = new AdsService();

    await refused.prepare();
    await refused.prepare();
    expect(mockGatherConsent).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    mockGatherConsent.mockRejectedValue(new Error("offline"));
    mockGetConsentInfo.mockResolvedValue(NOT_ASKED);
    const unasked = new AdsService();

    await unasked.prepare();
    await unasked.prepare();
    expect(mockGatherConsent).toHaveBeenCalledTimes(2);
  });

  it("reports the reason the SDK could not start", async () => {
    mockGatherConsent.mockResolvedValue({ canRequestAds: true });
    mockInitialize.mockRejectedValue(new Error("invalid application id"));

    await expect(new AdsService().prepare()).resolves.toBe(false);
    expect(crashed).toHaveBeenCalledWith(
      expect.any(Error),
      "AdsService.initialize",
    );
  });
});
