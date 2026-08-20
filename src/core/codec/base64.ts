import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Byte ⇄ base64 conversion, for the two places bytes have to travel as text:
 * the AES envelope every `/api/v1` request is wrapped in, and the PCM frames
 * the voice assistant streams to and from the Live API.
 *
 * @remarks
 * - **`btoa`/`atob` with a Buffer fallback** — React Native provides both
 *   globals, jest-expo does not always, and the fallback keeps the same module
 *   working in a Node test without a second implementation to keep in sync.
 * - **Chunked, not per-byte** — the audio path converts a frame every 100 ms,
 *   and building the binary string one `+=` at a time re-allocated it on each
 *   byte. `fromCharCode.apply` over a slice does the same work in one call;
 *   the slice size is bounded because a long argument list overflows the stack.
 */
// Large enough that a 100 ms PCM frame is one or two calls, small enough that
// the argument list stays well inside every engine's limit.
const CHUNK_BYTES = 8192;

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa !== 'function') return Buffer.from(bytes).toString('base64');

  let binary = CharConstants.empty;
  for (let at = ValueConstants.zero; at < bytes.length; at += CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(at, at + CHUNK_BYTES));
  }
  return globalThis.btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  if (typeof globalThis.atob !== 'function') return new Uint8Array(Buffer.from(base64, 'base64'));

  const binary = globalThis.atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = ValueConstants.zero; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
