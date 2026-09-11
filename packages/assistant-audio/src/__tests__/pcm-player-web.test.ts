import { PcmPlayer } from '../pcm-player.web';

/**
 * The browser half of the player pair. A fake Web Audio graph records when
 * each chunk was scheduled, and its clock is moved by hand.
 */
class FakeSource {
  buffer: { duration: number } | null = null;
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stopped = false;
  connect(): void {}
  start(when: number): void {
    this.startedAt = when;
  }
  stop(): void {
    this.stopped = true;
  }
}

class FakeContext {
  static last: FakeContext | null = null;
  currentTime = 0;
  readonly destination = {};
  readonly sources: FakeSource[] = [];
  constructor() {
    FakeContext.last = this;
  }
  async resume(): Promise<void> {}
  async close(): Promise<void> {}
  createBuffer(_channels: number, length: number, rate: number) {
    return { duration: length / rate, copyToChannel: () => undefined };
  }
  createBufferSource(): FakeSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
}

const RATE = 24_000;
const context = (): FakeContext => FakeContext.last!;

beforeEach(() => {
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
});

describe('web PcmPlayer', () => {
  // Starting each chunk "now" leaves a seam the length of the socket's jitter.
  it('schedules each chunk exactly where the previous one ends', async () => {
    const player = new PcmPlayer();
    await player.prepare(RATE);

    player.enqueue(new Float32Array(2_400));
    player.enqueue(new Float32Array(2_400));

    expect(context().sources.map((s) => s.startedAt)).toEqual([0, 0.1]);
  });

  it('reports the level of what is playing, not of what arrived last', async () => {
    const player = new PcmPlayer();
    await player.prepare(RATE);
    player.enqueue(new Float32Array(2_400).fill(0.1));
    player.enqueue(new Float32Array(2_400).fill(0.9));

    context().currentTime = 0.05;
    expect(player.level()).toBeCloseTo(0.7);
    context().currentTime = 0.15;
    expect(player.level()).toBe(1);
  });

  it('stops everything scheduled and goes silent on flush', async () => {
    const player = new PcmPlayer();
    await player.prepare(RATE);
    player.enqueue(new Float32Array(24_000).fill(0.9));

    player.flush();

    expect(context().sources.every((s) => s.stopped)).toBe(true);
    expect(player.level()).toBe(0);
  });
});
