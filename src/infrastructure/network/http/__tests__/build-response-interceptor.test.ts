import type { AxiosResponse } from 'axios';
import { encryptEnvelope, keyFromHex } from '@infrastructure/crypto/aes-envelope';
import { EnvelopeDecryptError } from '@infrastructure/crypto/envelope-decrypt-error';
import { buildResponseInterceptor } from '@infrastructure/network/http/build-response-interceptor';
import { mapAxiosError } from '@infrastructure/network/errors/map-axios-error';
import { ValidationFailure } from '@core/failure';

// Regression: a reply sealed with a different key used to be left in place as
// the raw `{ payload, iv }`, and a 2xx then came back as `ok(envelope)` — a
// write answered by a backend on another key reported success.
describe('buildResponseInterceptor', () => {
  const appKey = keyFromHex('a'.repeat(64));
  const otherKey = keyFromHex('b'.repeat(64));
  const intercept = buildResponseInterceptor({
    baseUrl: 'https://api.test',
    tokenProvider: () => Promise.resolve(null),
    localeProvider: () => Promise.resolve('en'),
  }, appKey);
  const responseOf = (data: unknown): AxiosResponse =>
    ({ status: 200, data, config: { url: '/x' } }) as unknown as AxiosResponse;

  it('opens an envelope sealed with the app key', () => {
    const response = intercept(responseOf(encryptEnvelope({ data: { id: 'r1' } }, appKey)));

    expect(response.data).toEqual({ data: { id: 'r1' } });
  });

  it('rejects a 2xx reply sealed with another key instead of passing the envelope on as success', () => {
    expect(() => intercept(responseOf(encryptEnvelope({ data: {} }, otherKey)))).toThrow(EnvelopeDecryptError);
  });

  it('maps that rejection to a ValidationFailure', () => {
    let thrown: unknown;
    try {
      intercept(responseOf(encryptEnvelope({ data: {} }, otherKey)));
    } catch (error: unknown) {
      thrown = error;
    }

    expect(mapAxiosError(thrown)).toBeInstanceOf(ValidationFailure);
  });

  it('passes a body that is not an envelope through untouched', () => {
    expect(intercept(responseOf({ status: 'ok' })).data).toEqual({ status: 'ok' });
  });
});
