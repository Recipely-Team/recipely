// Without the entitlement every App Attest call fails on device, quietly: the
// client fails open, so only the backend's monitor log would ever show it.
describe('app.json', () => {
  it('gives the iOS app the production App Attest environment', () => {
    const { expo } = require('../../../../app.json') as {
      expo: { ios: { entitlements?: Record<string, string> } };
    };

    expect(expo.ios.entitlements?.['com.apple.developer.devicecheck.appattest-environment']).toBe('production');
  });
});
