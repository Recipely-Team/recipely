/** Never fewer: two cards side by side is the phone layout the prototype draws. */
const MIN_COLUMNS = 2;
/** Never more: the expanded viewport's six-card row on Explore. */
const MAX_COLUMNS = 6;
/** Below this a card cannot hold an 80 avatar with its padding and a two-word name. */
const MIN_CARD_WIDTH = 150;

/**
 * How many creator cards fit across `contentWidth` with `gap` between them —
 * two on a phone, up to six on a desktop column. Shared by the Explore grid
 * and the /creators page so the two never disagree about a card's width.
 */
export const creatorGridColumns = (contentWidth: number, gap: number): number =>
  Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.floor((contentWidth + gap) / (MIN_CARD_WIDTH + gap))));
