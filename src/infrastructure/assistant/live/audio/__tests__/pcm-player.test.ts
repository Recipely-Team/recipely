/**
 * Contract tests for the assistant's playback node.
 *
 * @remarks
 * - **The queue node's `start` is the REAL one from the library**, reached by
 *   importing its module file directly (the package root installs a native
 *   module and throws under Jest). A hand-written fake would accept any
 *   arguments at all, which is exactly why the first defect below shipped
 *   twice: the validation that rejects the call lives in the library, not in
 *   our code.
 * - **The fake context runs at 48 kHz on purpose.** The model sends 24 kHz and
 *   Android hardware runs at whatever it likes; the player has to meet the
 *   device rather than dictate to it.
 */

import { PcmPlayer } from '@infrastructure/assistant/live/audio/pcm-player';

const RealQueueSourceNode: { prototype: { start: (when?: number, offset?: number) => void } } =
  jest.requireActual('react-native-audio-api/lib/module/core/AudioBufferQueueSourceNode').default;

interface Probe {
  started: unknown[][];
  opened: unknown[];
  buffers: { channels: number; length: number; rate: number }[];
}

const probe = (): Probe => (globalThis as never as { __probe: Probe }).__probe;

const HARDWARE_RATE = 48_000;
const MODEL_RATE = 24_000;

jest.mock('react-native-audio-api', () => {
  const Real = jest.requireActual(
    'react-native-audio-api/lib/module/core/AudioBufferQueueSourceNode',
  ).default;
  const at = (): Probe => (globalThis as never as { __probe: Probe }).__probe;

  class FakeContext {
    readonly sampleRate = 48_000;
    readonly destination = {};

    constructor(options?: unknown) {
      at().opened.push(options);
    }

    createBufferQueueSource(): unknown {
      // Real prototype: `start` and `stop` are the library's, so their argument
      // validation runs against whatever the player passes.
      const queue = Object.create(Real.prototype) as Record<string, unknown>;
      queue.node = {
        start: (...args: unknown[]) => at().started.push(args),
        stop: () => undefined,
        enqueueBuffer: () => undefined,
      };
      queue.connect = () => undefined;
      queue.clearBuffers = () => undefined;
      return queue;
    }

    createBuffer(channels: number, length: number, rate: number): unknown {
      at().buffers.push({ channels, length, rate });
      return { buffer: {}, copyToChannel: () => undefined };
    }

    async close(): Promise<void> {}
  }

  return { AudioContext: FakeContext, AudioBufferQueueSourceNode: Real };
});

beforeEach(() => {
  (globalThis as never as { __probe: Probe }).__probe = { started: [], opened: [], buffers: [] };
});

describe('PcmPlayer', () => {
  it('starts playback with arguments the library actually accepts', async () => {
    const result = await new PcmPlayer().prepare(MODEL_RATE);

    expect(result.ok).toBe(true);
    expect(probe().started).toEqual([[0, 0]]);
  });

  // A device reported a native SIGSEGV inside libaudioclient.so on starting
  // voice. Asking Android's audio HAL for a rate it does not run at is a
  // request it may honour, quietly refuse, or crash on.
  it('opens the output at the hardware rate rather than dictating one', async () => {
    await new PcmPlayer().prepare(MODEL_RATE);

    expect(probe().opened).toEqual([undefined]);
  });

  // Labelling 24 kHz frames with the context's rate without converting them
  // plays them at whatever ratio the two happen to have. It only ever sounded
  // right because the context was forced to match.
  it('converts the model audio to the rate the output actually runs at', async () => {
    const player = new PcmPlayer();
    await player.prepare(MODEL_RATE);

    player.enqueue(new Float32Array(2_400));

    expect(probe().buffers).toEqual([{ channels: 1, length: 4_800, rate: HARDWARE_RATE }]);
  });

  // The trap itself, pinned: `start(when = 0, offset = -1)` is the library's
  // own signature and its own guard throws on a negative offset, so the
  // no-argument call its types invite always raised.
  it('shows that the library rejects its own default offset', () => {
    const queue = Object.create(RealQueueSourceNode.prototype) as {
      node: unknown;
      start: (when?: number, offset?: number) => void;
    };
    queue.node = { start: () => undefined };

    expect(() => queue.start()).toThrow(/offset must be a finite non-negative number: -1/);
  });
});
