import {
  float32ToPcm16Base64,
  pcm16Base64ToFloat32,
  resample,
} from '@infrastructure/assistant/live/pcm-codec';

describe('pcm-codec', () => {
  const decodeToInt16 = (base64: string): Int16Array => {
    const bytes = Buffer.from(base64, 'base64');
    return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
  };

  it('round-trips samples within the precision 16 bits allows', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 0.25, -0.75, 1, -1]);

    const decoded = pcm16Base64ToFloat32(float32ToPcm16Base64(samples));

    expect(decoded.length).toBe(samples.length);
    for (let i = 0; i < samples.length; i++) {
      expect(decoded[i]).toBeCloseTo(samples[i]!, 4);
    }
  });

  // A sample of exactly 1.0 scaled by 32768 overflows to -32768 in two's
  // complement: the loudest peak of every utterance would come out as the
  // loudest possible NEGATIVE sample, heard as a click. The two directions
  // therefore scale by different numbers, which is the whole reason this
  // function is not one multiply.
  it('does not wrap full scale round to the negative rail', () => {
    const encoded = decodeToInt16(float32ToPcm16Base64(new Float32Array([1, -1])));

    expect(encoded[0]).toBe(32767);
    expect(encoded[1]).toBe(-32768);
  });

  it('clamps samples outside the unit range instead of wrapping them', () => {
    const encoded = decodeToInt16(float32ToPcm16Base64(new Float32Array([4, -4, 1.0001, -1.0001])));

    expect(Array.from(encoded)).toEqual([32767, -32768, 32767, -32768]);
  });

  it('writes little-endian, which is what audio/pcm on the wire means', () => {
    // 0x1234 = 4660; little-endian puts 0x34 first.
    const encoded = float32ToPcm16Base64(new Float32Array([4660 / 32767]));

    expect(Array.from(Buffer.from(encoded, 'base64'))).toEqual([0x34, 0x12]);
  });

  it('ignores a trailing odd byte rather than reading past the buffer', () => {
    const odd = Buffer.from([0x34, 0x12, 0x7f]).toString('base64');

    expect(pcm16Base64ToFloat32(odd).length).toBe(1);
  });

  describe('resample', () => {
    it('returns the same samples when the rates already match', () => {
      const samples = new Float32Array([0.1, 0.2, 0.3]);

      expect(resample(samples, 16000, 16000)).toBe(samples);
    });

    // The hardware rate is a preference, not a promise: `onAudioReady` may hand
    // back 48 kHz. Sending those bytes labelled 16 kHz makes the model hear
    // triple-speed gibberish rather than error, so the length has to actually
    // shrink by the ratio.
    it('shrinks 48 kHz hardware output to the 16 kHz the wire expects', () => {
      const samples = new Float32Array(4800);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i / 10);

      expect(resample(samples, 48000, 16000).length).toBe(1600);
    });

    it('grows 24 kHz playback to a 48 kHz output device', () => {
      expect(resample(new Float32Array(2400), 24000, 48000).length).toBe(4800);
    });

    it('keeps a constant signal constant, so no interpolation drift is introduced', () => {
      const flat = new Float32Array(100).fill(0.4);

      for (const sample of resample(flat, 48000, 16000)) expect(sample).toBeCloseTo(0.4, 6);
    });

    it('handles an empty frame', () => {
      expect(resample(new Float32Array(), 48000, 16000).length).toBe(0);
    });
  });
});
