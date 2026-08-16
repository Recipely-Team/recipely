import { buildFeedRows } from '@presentation/app/recipes/model/ads/build-feed-rows';
import { FeedRowKind } from '@presentation/app/recipes/model/ads/feed-row-kind';
import { FEED_ROWS_BEFORE_FIRST_AD, FEED_ROWS_BETWEEN_ADS } from '@infrastructure/constants/ads';

import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** Only `id` is read here; the row builder never looks inside a recipe. */
const recipes = (count: number): readonly RecipeSummaryEntity[] =>
  Array.from({ length: count }, (_, i) => ({ id: `r${i}` }) as RecipeSummaryEntity);

const adCount = (rows: ReturnType<typeof buildFeedRows>): number =>
  rows.filter((row) => row.kind === FeedRowKind.Ad).length;

const adPositions = (rows: ReturnType<typeof buildFeedRows>): number[] =>
  rows.reduce<number[]>((acc, row, i) => (row.kind === FeedRowKind.Ad ? [...acc, i] : acc), []);

describe('buildFeedRows — with ads off', () => {
  // WHY: the promise this feature is allowed to exist under. A user who is not
  // being served ads must get the feed that existed before any of this.
  it('returns the recipes and nothing else', () => {
    const rows = buildFeedRows(recipes(40), false);

    expect(rows).toHaveLength(40);
    expect(adCount(rows)).toBe(0);
  });
});

describe('buildFeedRows — with ads on', () => {
  it('shows no ad in a feed too short to reach the first gap', () => {
    expect(adCount(buildFeedRows(recipes(FEED_ROWS_BEFORE_FIRST_AD), true))).toBe(0);
  });

  it('places the first ad only after the opening run of recipes', () => {
    const rows = buildFeedRows(recipes(FEED_ROWS_BEFORE_FIRST_AD + 1), true);

    expect(adPositions(rows)).toEqual([FEED_ROWS_BEFORE_FIRST_AD]);
  });

  // WHY: a banner under the final recipe reads as the end of the app rather
  // than the end of the list, and it is the placement most likely to be tapped
  // by someone who has run out of feed to scroll.
  it('never ends the feed on an ad', () => {
    for (let count = 1; count <= 40; count += 1) {
      const rows = buildFeedRows(recipes(count), true);
      expect(rows.at(-1)?.kind).toBe(FeedRowKind.Recipe);
    }
  });

  it('leaves the wider gap between one ad and the next', () => {
    const rows = buildFeedRows(recipes(FEED_ROWS_BEFORE_FIRST_AD + FEED_ROWS_BETWEEN_ADS + 2), true);
    const [first, second] = adPositions(rows);

    expect(first).toBe(FEED_ROWS_BEFORE_FIRST_AD);
    // +1 for the ad row itself now sitting in the list.
    expect((second ?? 0) - (first ?? 0)).toBe(FEED_ROWS_BETWEEN_ADS + 1);
  });

  it('keeps every recipe, in order, however many ads land between them', () => {
    const source = recipes(50);
    const rows = buildFeedRows(source, true);

    const kept = rows.flatMap((row) => (row.kind === FeedRowKind.Recipe ? [row.recipe.id] : []));
    expect(kept).toEqual(source.map((r) => r.id));
  });

  // WHY: the key FlatList uses. Reusing one remounts a banner and re-requests
  // an ad; two ads sharing a key is the way that happens by accident.
  it('gives each ad its own ordinal', () => {
    const rows = buildFeedRows(recipes(50), true);
    const ordinals = rows.flatMap((row) => (row.kind === FeedRowKind.Ad ? [row.ordinal] : []));

    expect(ordinals).toEqual([...new Set(ordinals)]);
    expect(ordinals).toEqual([...ordinals].sort((a, b) => a - b));
  });

  it('handles an empty feed without inventing a row', () => {
    expect(buildFeedRows([], true)).toEqual([]);
  });
});
