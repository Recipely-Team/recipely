import { ValueConstants } from '@core/constants';
import { isIos } from '@infrastructure/constants/platform';

/**
 * Ad unit ids and how often the feed is allowed to show one.
 *
 * @remarks
 * - **A unit belongs to one app, and iOS and Android are two apps.** AdMob
 *   issues unit ids per app, so the platforms cannot share them: an Android
 *   unit requested from an iOS build never fills, and would report against the
 *   wrong app if it did. Each placement therefore names both and the running
 *   platform picks.
 * - **Google's public test units are the default, deliberately.** Requesting a
 *   real unit from a development build is a policy violation that can get the
 *   AdMob account suspended, and it is the easy mistake to make — nothing
 *   fails, the impressions just count. A build without the env vars serves
 *   test ads and is safe; a release build gets the real ids from
 *   `EXPO_PUBLIC_ADMOB_<PLATFORM>_*`.
 * - **Frequency is a product decision, so it is named here rather than spelled
 *   into the list.** The first ad sits far enough down that the feed reads as a
 *   feed before it reads as inventory, and the gap after it is wide enough that
 *   scrolling never lands on two in one screen.
 * - **One unit, because there is one placement.** There were three: the feed,
 *   the generating checklist and the import queue. The latter two were wait
 *   screens — a spinner, a stage list and a progress bar — which carry no
 *   publisher content, and ads on such a screen are a policy violation, not
 *   inventory. Only a screen showing something the user came to read may carry
 *   an ad, and in this app that is the feed.
 * - **Blank counts as unset.** These arrive from CI, where an undeclared secret
 *   is an EMPTY STRING rather than undefined — and `?? fallback` does not catch
 *   that. A unit id of `''` requests nothing and reports nothing, which looks
 *   from the outside exactly like ads that "do not fill".
 */

/** Google's always-available test banner. Serves a house ad, counts nothing. */
const TEST_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

/**
 * The running platform's unit, or the test unit when it is unset OR blank.
 *
 * Asked on every call rather than resolved once at module scope — the same
 * reason `platform.ts` exports predicates instead of constants: a module-level
 * read freezes at import, and the suites that cover both platforms would then
 * be measuring whichever one happened to load first.
 */
const unitId = (ios: string | undefined, android: string | undefined): string => {
  const configured = isIos() ? ios : android;
  return configured !== undefined && configured.trim().length > ValueConstants.zero
    ? configured
    : TEST_BANNER_UNIT_ID;
};

/** Banner between recipe rows in the feed. */
export const feedBannerUnitId = (): string =>
  unitId(
    process.env.EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID,
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID,
  );

/** Rows of recipes shown before the first ad may appear. */
export const FEED_ROWS_BEFORE_FIRST_AD = 6;

/** Rows of recipes between one ad and the next. */
export const FEED_ROWS_BETWEEN_ADS = 10;
