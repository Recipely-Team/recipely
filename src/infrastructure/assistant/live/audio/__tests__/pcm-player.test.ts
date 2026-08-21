/**
 * Contract test for the assistant's playback node.
 *
 * @remarks
 * - **The queue node's `start` is the REAL one from the library**, reached by
 *   importing its module file directly (the package root installs a native
 *   module and throws under Jest). A hand-written fake would accept any
 *   arguments at all, which is exactly why the defect below shipped twice: the
 *   validation that rejects the call lives in the library, not in our code.
 * - **The defect**: `start(when = 0, offset = -1)` is the library's own
 *   signature, and its own guard throws on a negative offset. So `start()` —
 *   the no-argument call its TypeScript types invite — always raised
 *   `offset must be a finite non-negative number: -1`, which reached the user
 *   as a session that would not begin.
 */

import { PcmPlayer } from '@infrastructure/assistant/live/audio/pcm-player';

// Required rather than imported: the module file ships no declaration beside
// it, and the package ROOT cannot be loaded under Jest at all — it installs a
// native module and throws. Typed here to exactly the surface this test uses.
const RealQueueSourceNode: { prototype: { start: (when?: number, offset?: number) => void } } =
  jest.requireActual('react-native-audio-api/lib/module/core/AudioBufferQueueSourceNode').default;

const started: unknown[][] = [];

jest.mock('react-native-audio-api', () => {
  const Real = jest.requireActual(
    'react-native-audio-api/lib/module/core/AudioBufferQueueSourceNode',
  ).default;

  class FakeContext {
    readonly sampleRate = 24000;
    readonly destination = {};
    createBufferQueueSource(): unknown {
      // Real prototype: `start` and `stop` are the library's, so their argument
      // validation runs against whatever the player passes.
      const queue = Object.create(Real.prototype) as Record<string, unknown>;
      queue.node = {
        start: (...args: unknown[]) => (globalThis as never as { __started: unknown[][] }).__started.push(args),
        stop: () => undefined,
      };
      queue.connect = () => undefined;
      queue.clearBuffers = () => undefined;
      return queue;
    }
    createBuffer(): unknown {
      return { copyToChannel: () => undefined };
    }
    async close(): Promise<void> {}
  }

  return { AudioContext: FakeContext, AudioBufferQueueSourceNode: Real };
});

beforeEach(() => {
  started.length = 0;
  (globalThis as never as { __started: unknown[][] }).__started = started;
});

describe('PcmPlayer', () => {
  it('starts playback with arguments the library actually accepts', async () => {
    const result = await new PcmPlayer().prepare(24000);

    expect(result.ok).toBe(true);
    expect(started).toEqual([[0, 0]]);
  });

  // The trap itself, pinned: if a future edit drops the arguments, the test
  // above fails with this exact message rather than the device doing so.
  it('shows that the library rejects its own default offset', () => {
    const queue = Object.create(RealQueueSourceNode.prototype) as {
      node: unknown;
      start: (when?: number, offset?: number) => void;
    };
    queue.node = { start: () => undefined };

    expect(() => queue.start()).toThrow(/offset must be a finite non-negative number: -1/);
  });
});
