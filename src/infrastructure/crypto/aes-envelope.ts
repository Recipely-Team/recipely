import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import type { Envelope } from '@infrastructure/crypto/envelope';
import { EnvelopeDecryptError } from '@infrastructure/crypto/envelope-decrypt-error';
import { CharConstants, RadixConstants, RegexConstants, ValueConstants } from '@core/constants';

const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
/** AES-256 takes a 32-byte key — the "256" is bits. */
const KEY_BYTES = 32;
/** Shortest sealed payload that could hold a tag: the tag plus one byte. */
const MIN_SEALED_BYTES = AUTH_TAG_BYTES + ValueConstants.one;

/**
 * Converts a 64-character hex string into a 32-byte `Uint8Array` suitable for
 * use as an AES-256-GCM key. Throws if the input is not exactly 64 hex chars.
 */
export function keyFromHex(hex: string): Uint8Array {
  if (!RegexConstants.sha256Hex.test(hex)) {
    throw new Error('AES key must be 64 hex chars (32 bytes)');
  }
  const out = new Uint8Array(KEY_BYTES);
  for (let i = ValueConstants.zero; i < KEY_BYTES; i++) {
    const at = i * RadixConstants.hexCharsPerByte;
    out[i] = parseInt(hex.slice(at, at + RadixConstants.hexCharsPerByte), RadixConstants.hex);
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = CharConstants.empty;
  for (let i = ValueConstants.zero; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  // RN/Expo provide a global `btoa`. fall back to Buffer for tests under jest-expo.
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(b64: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = ValueConstants.zero; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * Serialises `plain` to JSON and encrypts it with AES-256-GCM using a fresh
 * random 12-byte IV per call. Returns an `Envelope` whose `payload` and `iv`
 * fields are base64-encoded for wire transport.
 */
export function encryptEnvelope(plain: unknown, key: Uint8Array): Envelope {
  const iv = randomBytes(IV_BYTES);
  const cipher = gcm(key, iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(plain));
  const sealed = cipher.encrypt(plaintext); // includes auth tag at the end
  return {
    payload: toBase64(sealed),
    iv: toBase64(iv),
  };
}

/**
 * Decrypts an `Envelope` produced by `encryptEnvelope` and returns the
 * deserialised plain-text value. Throws `EnvelopeDecryptError` if the IV or
 * payload are malformed, or if the GCM auth tag check fails.
 */
export function decryptEnvelope(envelope: Envelope, key: Uint8Array): unknown {
  if (typeof envelope.payload !== 'string' || typeof envelope.iv !== 'string') {
    throw new EnvelopeDecryptError('Envelope missing payload or iv');
  }
  const iv = fromBase64(envelope.iv);
  if (iv.length !== IV_BYTES) {
    throw new EnvelopeDecryptError(`IV must decode to ${IV_BYTES} bytes`);
  }
  const sealed = fromBase64(envelope.payload);
  if (sealed.length < MIN_SEALED_BYTES) {
    throw new EnvelopeDecryptError('Payload shorter than auth tag');
  }
  try {
    const plain = gcm(key, iv).decrypt(sealed);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (err) {
    throw new EnvelopeDecryptError(
      `Failed to decrypt: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}
