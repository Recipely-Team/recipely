import { timerWarnings } from '@domain/timers/timer-warnings';

const MINUTE = 60_000;
const NOW = 1_000_000;

const leads = (minutes: number): number[] =>
  timerWarnings(NOW + minutes * MINUTE, NOW).map((w) => w.minutesLeft);

describe('timerWarnings', () => {
  it('gives a 10-minute timer a 5- and a 1-minute heads-up', () => {
    expect(leads(10)).toEqual([5, 1]);
  });

  it('gives a 3-minute timer only the 1-minute heads-up', () => {
    expect(leads(3)).toEqual([1]);
  });

  it('gives a 2-minute timer the 1-minute heads-up at its halfway point', () => {
    expect(leads(2)).toEqual([1]);
  });

  it('gives a 90-second timer no heads-up at all', () => {
    expect(leads(1.5)).toEqual([]);
  });

  it('fires each heads-up its lead before the end', () => {
    const end = NOW + 20 * MINUTE;
    expect(timerWarnings(end, NOW).map((w) => w.fireAtMs)).toEqual([end - 5 * MINUTE, end - MINUTE]);
  });

  it('judges a resumed timer by the time it has left', () => {
    expect(timerWarnings(NOW + 4 * MINUTE, NOW).map((w) => w.minutesLeft)).toEqual([1]);
  });
});
