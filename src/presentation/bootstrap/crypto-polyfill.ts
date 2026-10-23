import { getRandomValues as expoGetRandomValues } from 'expo-crypto';

// WHY: React Native / Hermes does not expose `globalThis.crypto.getRandomValues`
// out of the box, but @noble/ciphers (used by the AES envelope on every
// authenticated request) throws without it. expo-crypto provides a native
// implementation; bind it once at app start so the rest of the codebase can
// keep using the standard Web Crypto API surface.
const polyfill = expoGetRandomValues as unknown as Crypto['getRandomValues'];

const target = globalThis as { crypto?: { getRandomValues?: Crypto['getRandomValues'] } };
if (typeof target.crypto !== 'object') {
  target.crypto = { getRandomValues: polyfill };
} else if (typeof target.crypto.getRandomValues !== 'function') {
  target.crypto.getRandomValues = polyfill;
}
