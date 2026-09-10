import { createDecipheriv } from 'node:crypto';
import { decryptEnvelope, encryptEnvelope, keyFromHex } from '@infrastructure/crypto/aes-envelope';
import { EnvelopeDecryptError } from '@infrastructure/crypto/envelope-decrypt-error';
import vectors from '@/modules/recipely-assistant-kit/__fixtures__/aes-gcm-vectors.json';

/**
 * The JS third of the envelope parity suite.
 *
 * The same fixture is read by `EnvelopeParityTest.kt` (javax.crypto) and by
 * `scripts/verify-swift-envelope.swift` (CryptoKit). Three implementations, one
 * set of bytes: a headless Siri answer is encrypted by Swift and decrypted by
 * the backend, so "it works in JS" is not evidence about the path that runs
 * when the app is not even launched.
 *
 * The vectors themselves were produced by OpenSSL (`node:crypto`), which is a
 * fourth implementation and none of the three under test — so this file also
 * decrypts with `node:crypto` to pin the ENCRYPT direction, which the fixture
 * alone cannot check: `encryptEnvelope` draws its own random IV, by design.
 */
describe('aes-envelope · cross-implementation parity', () => {
  const key = keyFromHex(vectors.keyHex);

  describe('decrypts what OpenSSL sealed', () => {
    for (const vector of vectors.vectors) {
      // `proves` travels into the test name so a failure says what broke, not
      // just which index of an array it was.
      it(`${vector.name} — ${vector.proves}`, () => {
        const plain = decryptEnvelope({ payload: vector.payloadBase64, iv: vector.ivBase64 }, key);

        expect(plain).toEqual(JSON.parse(vector.plaintext));
      });
    }
  });

  describe('refuses what every implementation must refuse', () => {
    for (const reject of vectors.rejects) {
      it(`${reject.name} — ${reject.proves}`, () => {
        expect(() => decryptEnvelope({ payload: reject.payloadBase64, iv: reject.ivBase64 }, key)).toThrow(
          EnvelopeDecryptError,
        );
      });
    }
  });

  it('seals bytes OpenSSL can open — the direction the fixture cannot pin', () => {
    const body = { message: 'İki yumurtayla ne pişirebilirim?', languageCode: 'tr' };
    const envelope = encryptEnvelope(body, key);

    const sealed = Buffer.from(envelope.payload, 'base64');
    const tagAt = sealed.length - vectors.authTagBytes;
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(vectors.keyHex, 'hex'), Buffer.from(envelope.iv, 'base64'));
    decipher.setAuthTag(sealed.subarray(tagAt));
    const opened = Buffer.concat([decipher.update(sealed.subarray(0, tagAt)), decipher.final()]).toString('utf8');

    expect(JSON.parse(opened)).toEqual(body);
  });
});
