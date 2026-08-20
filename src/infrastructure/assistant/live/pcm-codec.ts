import { base64ToBytes, bytesToBase64 } from '@core/codec/base64';
import { ValueConstants } from '@core/constants';

/**
 * The format conversion between the device's audio graph and the Live API wire.
 *
 * @remarks
 * - **Two rates, not one** — the API takes 16 kHz little-endian signed 16-bit
 *   mono going up and answers with 24 kHz in the same shape. Neither is the
 *   rate the hardware runs at, which is why `resample` exists rather than a
 *   `sampleRate` argument passed to the recorder and trusted: `onAudioReady`
 *   documents its rate as a *preference* the device may not honour, and a
 *   session fed 48 kHz samples labelled 16 kHz transcribes as gibberish at
 *   triple speed rather than failing outright.
 * - **The asymmetric clamp is not a rounding detail** — two's complement holds
 *   one more negative value than positive, so the two directions scale by
 *   different numbers. Multiplying both sides by 32768 lets a sample of exactly
 *   1.0 wrap to the largest NEGATIVE value, which is heard as a click on every
 *   peak.
 * - **Pure functions, no state** — this is the hot path (a frame every 100 ms
 *   each way), so it allocates one typed array per call and nothing else.
 */
const INT16_MAX = 32767;
const INT16_MIN = -32768;
const BYTES_PER_SAMPLE = 2;

function clamp(sample: number): number {
  if (sample > 1) return 1;
  if (sample < -1) return -1;
  return sample;
}

/** Encodes recorder samples for `realtimeInput.audio`. */
export function float32ToPcm16Base64(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.length * BYTES_PER_SAMPLE);
  const view = new DataView(bytes.buffer);

  for (let i = ValueConstants.zero; i < samples.length; i++) {
    const sample = clamp(samples[i] ?? ValueConstants.zero);
    view.setInt16(i * BYTES_PER_SAMPLE, Math.round(sample * (sample < 0 ? -INT16_MIN : INT16_MAX)), true);
  }
  return bytesToBase64(bytes);
}

/** Decodes an `inlineData` audio part into samples the player can queue. */
export function pcm16Base64ToFloat32(base64: string): Float32Array {
  const bytes = base64ToBytes(base64);
  const count = Math.floor(bytes.length / BYTES_PER_SAMPLE);
  const samples = new Float32Array(count);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = ValueConstants.zero; i < count; i++) {
    const raw = view.getInt16(i * BYTES_PER_SAMPLE, true);
    samples[i] = raw / (raw < 0 ? -INT16_MIN : INT16_MAX);
  }
  return samples;
}

/**
 * Linear resampling between the hardware rate and the wire rate.
 *
 * Linear interpolation aliases above the Nyquist frequency, which a proper
 * filter would prevent. It is the right trade here anyway: the destination is
 * a speech model whose useful band ends around 8 kHz, and the alternative costs
 * CPU on every frame of a live session for quality no listener receives.
 */
export function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || samples.length === ValueConstants.zero) return samples;

  const ratio = fromRate / toRate;
  const count = Math.floor(samples.length / ratio);
  const out = new Float32Array(count);

  for (let i = ValueConstants.zero; i < count; i++) {
    const at = i * ratio;
    const left = Math.floor(at);
    const right = Math.min(left + ValueConstants.one, samples.length - ValueConstants.one);
    const weight = at - left;
    out[i] = (samples[left] ?? ValueConstants.zero) * (1 - weight) + (samples[right] ?? ValueConstants.zero) * weight;
  }
  return out;
}
