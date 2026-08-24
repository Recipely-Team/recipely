import { base64ToBytes, bytesToBase64 } from '@core/codec/base64';
import { CharConstants } from '@core/constants';

describe('base64', () => {
  const withoutGlobals = (run: () => void) => {
    const btoa = globalThis.btoa;
    const atob = globalThis.atob;
    // @ts-expect-error — deleting the globals is the point: the Buffer fallback
    // is what runs on any runtime that does not provide them.
    delete globalThis.btoa;
    // @ts-expect-error — see above.
    delete globalThis.atob;
    try {
      run();
    } finally {
      globalThis.btoa = btoa;
      globalThis.atob = atob;
    }
  };

  it('round-trips every byte value', () => {
    const bytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) bytes[i] = i;

    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('agrees with the Buffer fallback, so a device and a test encode alike', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255, 42, 7]);
    const viaGlobals = bytesToBase64(bytes);

    let viaBuffer = '';
    withoutGlobals(() => {
      viaBuffer = bytesToBase64(bytes);
    });

    expect(viaGlobals).toBe(Buffer.from(bytes).toString('base64'));
    expect(viaBuffer).toBe(viaGlobals);
  });

  it('decodes the same bytes with or without atob', () => {
    const encoded = Buffer.from([9, 250, 3, 200, 17]).toString('base64');
    const viaGlobals = base64ToBytes(encoded);

    let viaBuffer = base64ToBytes(CharConstants.empty);
    withoutGlobals(() => {
      viaBuffer = base64ToBytes(encoded);
    });

    expect(Array.from(viaBuffer)).toEqual(Array.from(viaGlobals));
  });

  // A 100 ms PCM frame at 16 kHz is 3200 bytes and a second of playback at
  // 24 kHz is 48000 — comfortably past the chunk size, which is where a
  // fromCharCode spread would blow the argument limit if it were unchunked.
  it('encodes a buffer larger than one chunk', () => {
    const bytes = new Uint8Array(48_000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;

    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});
