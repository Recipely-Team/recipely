/**
 * Byte ⇄ base64 for PCM frames.
 *
 * `btoa`/`atob` where the runtime has them (React Native, browsers), `Buffer`
 * where it does not (some test environments). Chunked, because a 100 ms frame
 * built one character at a time reallocates the string on every byte, and one
 * giant argument list overflows the stack.
 */
const CHUNK_BYTES = 8192;

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa !== 'function') return Buffer.from(bytes).toString('base64');

  let binary = '';
  for (let at = 0; at < bytes.length; at += CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(at, at + CHUNK_BYTES));
  }
  return globalThis.btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  if (typeof globalThis.atob !== 'function') return new Uint8Array(Buffer.from(base64, 'base64'));

  const binary = globalThis.atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
