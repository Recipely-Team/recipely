import { AppState } from "react-native";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { requestTrackingPermission } from "@infrastructure/ads/request-tracking-permission";

jest.mock("expo-tracking-transparency", () => ({
  requestTrackingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

const requested = jest.mocked(requestTrackingPermissionsAsync);

const setCurrentState = (state: string): void => {
  Object.defineProperty(AppState, "currentState", {
    value: state,
    configurable: true,
  });
};

describe("requestTrackingPermission", () => {
  beforeEach(() => jest.clearAllMocks());

  it("asks straight away when the app is already in front", async () => {
    setCurrentState("active");

    await requestTrackingPermission();

    expect(requested).toHaveBeenCalledTimes(1);
  });

  // iOS drops an ATT request made before the app is active: no prompt, and an
  // answer of "not determined" — App Review would see no prompt at all.
  it("waits for the app to become active before asking", async () => {
    setCurrentState("inactive");
    let onChange: (state: string) => void = () => undefined;
    const remove = jest.fn();
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, handler) => {
        onChange = handler as (state: string) => void;
        return { remove };
      });

    const pending = requestTrackingPermission();
    await Promise.resolve();
    expect(requested).not.toHaveBeenCalled();

    onChange("background");
    await Promise.resolve();
    expect(requested).not.toHaveBeenCalled();

    onChange("active");
    await pending;
    expect(requested).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

// The prompt cannot appear without its Info.plist string, and iOS ads must
// never ship without the prompt — App Review rejected 1.2.0 for exactly that.
describe("app.json", () => {
  it("declares the ATT usage string wherever the ads SDK is installed", () => {
     
    const { expo } = require("../../../../app.json") as {
      expo: { plugins: (string | [string, Record<string, string>])[] };
    };
    const plugin = (name: string) =>
      expo.plugins.find((entry) => (Array.isArray(entry) ? entry[0] : entry) === name);

    expect(plugin("react-native-google-mobile-ads")).toBeDefined();
    const tracking = plugin("expo-tracking-transparency");
    expect(Array.isArray(tracking) && tracking[1].userTrackingPermission).toBeTruthy();
  });
});
