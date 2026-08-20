import { formatRating } from '@presentation/base/utils/format-rating';

describe('formatRating', () => {
  it('always shows exactly one decimal place', () => {
    expect(formatRating(4)).toBe('4.0');
    expect(formatRating(4.5)).toBe('4.5');
  });

  // Six components used to call `.toFixed(1)` themselves. Ratings arrive from
  // the backend as floats, so the card and the detail header were each one
  // rounding decision away from disagreeing about the same recipe.
  it('rounds to one place rather than truncating', () => {
    expect(formatRating(4.26)).toBe('4.3');
    expect(formatRating(4.9499999999999996)).toBe('4.9');
  });
});
