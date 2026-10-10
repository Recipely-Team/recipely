import { funnelRate } from '@domain/instagram/stats/funnel-rate';
import { periodDelta } from '@domain/instagram/stats/period-delta';

describe('funnelRate', () => {
  it('is the step as a whole percentage of the step before it', () => {
    expect(funnelRate(18, 36)).toBe(50);
    expect(funnelRate(1, 3)).toBe(33);
  });

  it('reads 0% rather than nothing when the step before is empty', () => {
    expect(funnelRate(0, 0)).toBe(0);
  });
});

describe('periodDelta', () => {
  it('is the change against the previous period, rounded, signed', () => {
    expect(periodDelta(36, 20)).toBe(80);
    expect(periodDelta(10, 20)).toBe(-50);
    expect(periodDelta(6, 6)).toBe(0);
  });

  it('has no delta when the previous period had nothing to grow from', () => {
    expect(periodDelta(5, 0)).toBeNull();
  });
});
