import { rms, toDisplayLevel } from '../loudness';

describe('loudness', () => {
  it('measures the root-mean-square of a range', () => {
    expect(rms(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5);
    expect(rms(new Float32Array([1, 0, 0, 0]), 1, 4)).toBe(0);
    expect(rms(new Float32Array([]))).toBe(0);
  });

  // A linear gain either left a whisper on the floor or pinned a normal voice
  // at the top; the decibel mapping keeps both on the scale and in order.
  it('puts silence, a whisper, speech and a shout in order on 0–1', () => {
    const silence = toDisplayLevel(0);
    const whisper = toDisplayLevel(0.01);
    const speech = toDisplayLevel(0.1);
    const shout = toDisplayLevel(0.9);

    expect(silence).toBe(0);
    expect(whisper).toBeCloseTo(0.3);
    expect(speech).toBeCloseTo(0.7);
    expect(shout).toBe(1);
  });

  it('floors noise below the scale instead of going negative', () => {
    expect(toDisplayLevel(0.0001)).toBe(0);
  });
});
