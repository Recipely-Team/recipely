import { toOsAssistantCredential } from '@infrastructure/assistant/token/assistant-intent-token-mapper';

describe('toOsAssistantCredential — a token must be datable', () => {
  it('reads a token and its absolute expiry', () => {
    expect(
      toOsAssistantCredential({ token: 'tok', expiresAt: '2026-10-11T00:00:00.000Z' }),
    ).toEqual({ token: 'tok', expiresAt: Date.parse('2026-10-11T00:00:00.000Z') });
  });

  // A token with no usable expiry is not a long-lived token, it is one nobody
  // can ever decide to replace — the native side would either trust it forever
  // or discard it on every launch.
  it.each([
    ['no expiry', { token: 'tok' }],
    ['an unparseable expiry', { token: 'tok', expiresAt: 'soon' }],
    ['an empty expiry', { token: 'tok', expiresAt: '' }],
  ])('refuses a response with %s', (_name, dto) => {
    expect(toOsAssistantCredential(dto)).toBeNull();
  });

  it.each([
    ['no token', { expiresAt: '2026-10-11T00:00:00.000Z' }],
    ['an empty token', { token: '', expiresAt: '2026-10-11T00:00:00.000Z' }],
  ])('refuses a response with %s', (_name, dto) => {
    expect(toOsAssistantCredential(dto)).toBeNull();
  });
});
