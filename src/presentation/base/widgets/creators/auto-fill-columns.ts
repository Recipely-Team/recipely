/**
 * How many cards a CSS `auto-fill, minmax(minCard, 1fr)` grid puts across
 * `contentWidth` with `gap` between them, never fewer than `min`. The /creators
 * grid (180) and a creator's recipe grid (270) both ask it.
 */
export const autoFillColumns = (contentWidth: number, minCard: number, gap: number, min: number): number =>
  Math.max(min, Math.floor((contentWidth + gap) / (minCard + gap)));
