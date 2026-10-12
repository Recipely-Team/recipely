const fs = require('node:fs');
const path = require('node:path');
const {
  PINNED_HOST,
  ROOT_PINS,
  PIN_EXPIRATION,
  networkSecurityConfig,
  withPinnedDomain,
} = require('../withApiCertificatePinning');

describe('withApiCertificatePinning', () => {
  it('pins the host api-hosts.ts sends production traffic to', () => {
    const hosts = fs.readFileSync(path.join(__dirname, '..', '..', 'src/infrastructure/constants/api/api-hosts.ts'), 'utf8');

    expect(hosts.match(/PROD_SERVER_URL = "([^"]+)"/)?.[1]).toBe(`https://${PINNED_HOST}`);
  });

  it('carries a backup: four distinct root pins, each a base64 SHA-256', () => {
    const digests = ROOT_PINS.map((pin) => pin.spkiSha256);

    expect(new Set(digests).size).toBe(4);
    for (const digest of digests) expect(Buffer.from(digest, 'base64')).toHaveLength(32);
  });

  it('expires the Android pins in the future, so a stale pin fails open, not offline', () => {
    expect(new Date(PIN_EXPIRATION).getTime()).toBeGreaterThan(Date.now());
  });

  it('allows cleartext only in the debug variant, and never to the pinned host', () => {
    const release = networkSecurityConfig({ cleartext: false });
    const debug = networkSecurityConfig({ cleartext: true });

    expect(release).toContain('<base-config cleartextTrafficPermitted="false" />');
    expect(debug).toContain('<base-config cleartextTrafficPermitted="true" />');
    for (const xml of [release, debug]) {
      expect(xml).toContain('<domain-config cleartextTrafficPermitted="false">');
      expect(xml).toContain(`<domain includeSubdomains="false">${PINNED_HOST}</domain>`);
      for (const pin of ROOT_PINS) expect(xml).toContain(`<pin digest="SHA-256">${pin.spkiSha256}</pin>`);
    }
  });

  it("adds the pinned domain to iOS ATS without dropping Expo's local-networking exemption", () => {
    const ats = withPinnedDomain({ NSAllowsArbitraryLoads: false, NSAllowsLocalNetworking: true });

    expect(ats.NSAllowsArbitraryLoads).toBe(false);
    expect(ats.NSAllowsLocalNetworking).toBe(true);
    expect(ats.NSPinnedDomains[PINNED_HOST]).toEqual({
      NSIncludesSubdomains: false,
      NSPinnedCAIdentities: ROOT_PINS.map((pin) => ({ 'SPKI-SHA256-BASE64': pin.spkiSha256 })),
    });
  });
});
