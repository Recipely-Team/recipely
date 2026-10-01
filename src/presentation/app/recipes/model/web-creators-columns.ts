/** The prototype's `repeat(6, minmax(0, 1fr))` row. */
const WIDE_COLUMNS = 6;
/** Below the breakpoint the row drops to three. */
const NARROW_COLUMNS = 3;
/** The viewport width the prototype's media query switches at. */
const BREAKPOINT = 860;

/**
 * How many creator cards the expanded Explore row draws: six from an 860-wide
 * viewport, three below it (design spec → Creators §4).
 */
export const webCreatorsColumns = (viewportWidth: number): number =>
  viewportWidth >= BREAKPOINT ? WIDE_COLUMNS : NARROW_COLUMNS;
