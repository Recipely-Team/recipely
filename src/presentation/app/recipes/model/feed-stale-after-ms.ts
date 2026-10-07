/**
 * How long (ms) a successfully loaded feed counts as fresh: returning to the
 * feed within this window does not refetch page 1.
 *
 * The feed used to refetch on EVERY refocus, so a quick detail → back → detail
 * browse issued a page-1 request per return for rows that had not changed. A
 * minute keeps the feed current for someone coming back later, while
 * pull-to-refresh remains the way to ask for it now.
 */
export const FEED_STALE_AFTER_MS = 60_000;
