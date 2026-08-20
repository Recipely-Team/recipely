import { decryptEnvelope, encryptEnvelope, keyFromHex } from '@infrastructure/crypto/aes-envelope';
import { EnvelopeDecryptError } from '@infrastructure/crypto/envelope-decrypt-error';

// Every `/api/v1` request travels inside this envelope, so it has no room to be
// "probably fine": these cover the round trip and each way it is allowed to
// fail. Written when the base64 helpers moved to @core/codec — the module had
// no test at all, and a silent encoding change here would have broken every
// request against a backend that still encoded the old way.
describe('aes-envelope', () => {
  const key = keyFromHex('a'.repeat(64));

  it('round-trips a JSON body', () => {
    const body = { title: 'Fırın Tavuğu', steps: ['ısıt', 'pişir'], page: 2, ok: true, missing: null };

    expect(decryptEnvelope(encryptEnvelope(body, key), key)).toEqual(body);
  });

  it('produces a different envelope every time, because the IV is fresh', () => {
    const first = encryptEnvelope({ a: 1 }, key);
    const second = encryptEnvelope({ a: 1 }, key);

    expect(first.iv).not.toBe(second.iv);
    expect(first.payload).not.toBe(second.payload);
  });

  it('rejects a hex key that is not 32 bytes', () => {
    expect(() => keyFromHex('abc')).toThrow();
    expect(() => keyFromHex('z'.repeat(64))).toThrow();
  });

  it('refuses an envelope whose fields are not strings', () => {
    expect(() => decryptEnvelope({ payload: undefined, iv: undefined } as never, key)).toThrow(
      EnvelopeDecryptError,
    );
  });

  it('refuses an IV that is not 12 bytes', () => {
    const { payload } = encryptEnvelope({ a: 1 }, key);

    expect(() => decryptEnvelope({ payload, iv: Buffer.from([1, 2, 3]).toString('base64') }, key)).toThrow(
      EnvelopeDecryptError,
    );
  });

  it('refuses a payload too short to hold the auth tag', () => {
    const { iv } = encryptEnvelope({ a: 1 }, key);

    expect(() => decryptEnvelope({ payload: Buffer.from([1, 2, 3]).toString('base64'), iv }, key)).toThrow(
      EnvelopeDecryptError,
    );
  });

  it('refuses a payload sealed with a different key', () => {
    const envelope = encryptEnvelope({ a: 1 }, keyFromHex('b'.repeat(64)));

    expect(() => decryptEnvelope(envelope, key)).toThrow(EnvelopeDecryptError);
  });
});
