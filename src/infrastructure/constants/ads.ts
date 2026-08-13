/**
 * Ad unit ids and how often the feed is allowed to show one.
 *
 * @remarks
 * - **Google's public test units are the default, deliberately.** Requesting a
 *   real unit from a development build is a policy violation that can get the
 *   AdMob account suspended, and it is the easy mistake to make — nothing
 *   fails, the impressions just count. A build without the env vars serves
 *   test ads and is safe; a release build gets the real ids from
 *   `EXPO_PUBLIC_ADMOB_*`.
 * - **Frequency is a product decision, so it is named here rather than spelled
 *   into the list.** The first ad sits far enough down that the feed reads as a
 *   feed before it reads as inventory, and the gap after it is wide enough that
 *   scrolling never lands on two in one screen.
 */

/** Google's always-available test banner. Serves a house ad, counts nothing. */
const TEST_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

/** Banner between recipe rows in the feed. */
export const FEED_BANNER_UNIT_ID: string =
  process.env.EXPO_PUBLIC_ADMOB_FEED_BANNER_UNIT_ID ?? TEST_BANNER_UNIT_ID;

/** Banner shown under the checklist while a recipe generates. */
export const GENERATING_BANNER_UNIT_ID: string =
  process.env.EXPO_PUBLIC_ADMOB_GENERATING_BANNER_UNIT_ID ?? TEST_BANNER_UNIT_ID;

/** Rows of recipes shown before the first ad may appear. */
export const FEED_ROWS_BEFORE_FIRST_AD = 6;

/** Rows of recipes between one ad and the next. */
export const FEED_ROWS_BETWEEN_ADS = 10;
