import { FocalPoint } from '@domain/recipes/media/focal-point';

describe('FocalPoint', () => {
  it('accepts every point on the frame, edges included', () => {
    for (const [x, y] of [[0, 0], [1, 1], [0.5, 0.25]] as const) {
      const p = FocalPoint.create(x, y);
      expect(p.ok && [p.value.x, p.value.y]).toEqual([x, y]);
    }
  });

  it.each([
    [-0.01, 0.5],
    [0.5, 1.01],
    [Number.NaN, 0.5],
    [0.5, Number.POSITIVE_INFINITY],
  ])('refuses a point off the frame (%p, %p)', (x, y) => {
    expect(FocalPoint.create(x, y).ok).toBe(false);
  });

  it('compares by value on both axes', () => {
    const a = FocalPoint.create(0.3, 0.4);
    const b = FocalPoint.create(0.3, 0.4);
    const c = FocalPoint.create(0.3, 0.5);
    if (!a.ok || !b.ok || !c.ok) throw new Error('expected points');
    expect(a.value.equals(b.value)).toBe(true);
    expect(a.value.equals(c.value)).toBe(false);
  });
});
