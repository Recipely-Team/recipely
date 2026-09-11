import { smoothLevel } from '../smooth-level';

describe('smoothLevel', () => {
  it('rises faster than it falls', () => {
    const rise = smoothLevel(0, 1, 0.05);
    const fall = 1 - smoothLevel(1, 0, 0.05);

    expect(rise).toBeGreaterThan(fall);
  });

  it('looks the same at any frame rate', () => {
    let at120 = 0;
    for (let i = 0; i < 12; i++) at120 = smoothLevel(at120, 1, 1 / 120);
    const at30 = [0, 1, 2].reduce((level) => smoothLevel(level, 1, 1 / 30), 0);

    expect(at120).toBeCloseTo(at30, 5);
  });

  it('does not move on a zero or negative interval', () => {
    expect(smoothLevel(0.4, 1, 0)).toBe(0.4);
    expect(smoothLevel(0.4, 1, -1)).toBe(0.4);
  });
});
