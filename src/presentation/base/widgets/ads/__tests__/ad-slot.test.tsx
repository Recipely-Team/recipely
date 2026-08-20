/**
 * Behaviour tests for `AdSlot`'s failure path.
 *
 * The SDK's `BannerAd` is replaced by a probe that captures the callbacks the
 * slot hands it, so a test can fire `onAdFailedToLoad` with a real AdMob-shaped
 * error and assert what the app does with the reason.
 */

import { FailureReporter } from "@presentation/base/errors/failure-reporter";
import { renderComponent } from "@presentation/base/test-support/render-component";
import { AdSlot } from "@presentation/base/widgets/ads/ad-slot";
import { act } from "react-test-renderer";

/** Captured so a test can fire the SDK's own failure callback. */
let onFailed: ((error: Error) => void) | undefined;

jest.mock("react-native-google-mobile-ads", () => ({
  __esModule: true,
  default: () => ({ initialize: async () => [] }),
  BannerAd: (props: { onAdFailedToLoad?: (error: Error) => void }) => {
    onFailed = props.onAdFailedToLoad;
    return null;
  },
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER" },
  AdsConsent: { gatherConsent: async () => ({ canRequestAds: true }) },
}));

jest.mock("@application/ads/get-ads-service", () => ({
  getAdsService: () => ({ prepare: async () => true }),
}));

/**
 * A unit id no other test in this file has used.
 *
 * The slot dedupes its reporting through a MODULE-scoped Set whose lifetime is
 * the session — right for the app, and impossible to reset from here without
 * re-requiring the module and losing the `FailureReporter` instance the sink is
 * attached to. So each test takes a fresh id instead of clearing the Set, and a
 * test added later cannot silently inherit another's "already reported".
 */
let unitCounter = 0;
const freshUnitId = (): string => {
  unitCounter++;
  return `ca-app-pub-test/${unitCounter}`;
};

/** Mounts the slot and settles the `useAdsReady` promise so the banner mounts. */
const mountSlot = async (unitId: string): Promise<void> => {
  renderComponent(<AdSlot unitId={unitId} accessibilityLabel="Ad" />);
  await act(async () => {
    await Promise.resolve();
  });
};

describe("AdSlot", () => {
  beforeEach(() => {
    onFailed = undefined;
  });

  afterEach(() => {
    FailureReporter.setSink(null);
  });

  // --- regression: ads were absent in the production build and the app could
  // not say why. `onAdFailedToLoad={() => setFailed(true)}` dropped the SDK's
  // error on the floor, so "no fill" (a healthy account with no inventory yet)
  // and "invalid request" (a wrong unit id, or an app id the manifest never
  // received) both reached us as the same thing: an empty space.
  it("reports the reason a banner did not load", async () => {
    const sink = jest.fn();
    FailureReporter.setSink(sink);

    await mountSlot(freshUnitId());
    expect(onFailed).toBeDefined();
    act(() => onFailed?.(new Error("Request Error: No ad config.")));

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("No ad config."),
      }),
      "AdSlot.load",
    );
  });

  it("reports a given unit only once, however many rows carry it", async () => {
    const sink = jest.fn();
    FailureReporter.setSink(sink);

    const unitId = freshUnitId();
    await mountSlot(unitId);
    act(() => onFailed?.(new Error("no fill")));
    await mountSlot(unitId);
    act(() => onFailed?.(new Error("no fill")));

    expect(sink).toHaveBeenCalledTimes(1);
  });
});
