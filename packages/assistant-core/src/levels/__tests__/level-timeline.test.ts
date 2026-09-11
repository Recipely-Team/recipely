import { LevelTimeline } from '../level-timeline';

const RATE = 1000;
const tone = (seconds: number, amplitude: number): Float32Array =>
  new Float32Array(Math.round(seconds * RATE)).map((_, i) => (i % 2 === 0 ? amplitude : -amplitude));

describe('LevelTimeline', () => {
  // A reply arrives far faster than it plays. Measured on arrival, the
  // "speaking" animation peaked while the queue filled and was flat for the
  // words the user heard; the reading has to follow the playhead.
  it('reports a chunk while it plays, not when it arrived', () => {
    const timeline = new LevelTimeline();
    timeline.push(tone(0.1, 0.1), RATE, 0);
    timeline.push(tone(0.1, 0.9), RATE, 0.001);

    expect(timeline.levelAt(0.05)).toBeCloseTo(0.7);
    expect(timeline.levelAt(0.15)).toBe(1);
    expect(timeline.levelAt(0.25)).toBe(0);
  });

  it('starts a chunk at now when the queue had drained', () => {
    const timeline = new LevelTimeline();
    timeline.push(tone(0.1, 0.9), RATE, 0);
    timeline.push(tone(0.1, 0.9), RATE, 5);

    expect(timeline.levelAt(1)).toBe(0);
    expect(timeline.levelAt(5.05)).toBe(1);
  });

  it('follows the envelope inside a chunk in ~20 ms slices', () => {
    const timeline = new LevelTimeline();
    const samples = new Float32Array([...tone(0.02, 0.9), ...tone(0.02, 0)]);
    timeline.push(samples, RATE, 0);

    expect(timeline.levelAt(0.01)).toBe(1);
    expect(timeline.levelAt(0.03)).toBe(0);
  });

  // The interruption: nothing already queued may keep the mouth moving.
  it('goes silent on clear, and schedules the next chunk from now', () => {
    const timeline = new LevelTimeline();
    timeline.push(tone(10, 0.9), RATE, 0);
    timeline.clear();

    expect(timeline.levelAt(1)).toBe(0);
    timeline.push(tone(0.1, 0.9), RATE, 2);
    expect(timeline.levelAt(2.05)).toBe(1);
  });

  it('keeps answering correctly after compacting a long session', () => {
    const timeline = new LevelTimeline();
    for (let chunk = 0; chunk < 100; chunk++) timeline.push(tone(0.1, 0.9), RATE, 0);
    for (let t = 0; t < 9.9; t += 0.05) timeline.levelAt(t);

    expect(timeline.levelAt(9.95)).toBe(1);
    expect(timeline.levelAt(10.5)).toBe(0);
  });
});
