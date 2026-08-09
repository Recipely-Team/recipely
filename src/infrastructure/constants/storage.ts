/**
 * Keys for everything the app persists through the key-value port.
 *
 * Each key carries an explicit `.vN` suffix: a stored value cannot be migrated
 * in place on a device that is already holding the old shape, so a breaking
 * change to what is written bumps the suffix and the stale value is ignored
 * rather than mis-parsed.
 *
 * Lives in infrastructure because storage is an infrastructure concern — the
 * layers above reach it through the port, never through these strings.
 */
export const SESSION_STORAGE_KEY = 'recipely.session.v1';

/**
 * Where the session used to live.
 *
 * The implementation carried its own `const STORAGE_KEY = 'layerly.session.v1'`
 * — a name left over from an earlier project — while `SESSION_STORAGE_KEY` sat
 * here unread. Pointing the code at the right constant without reading this one
 * first would have signed out every user holding a session.
 *
 * Delete once enough time has passed that no live install can still be on it.
 */
export const LEGACY_SESSION_STORAGE_KEY = 'layerly.session.v1';
export const TIMERS_STORAGE_KEY = 'recipely.timers.v1';
export const LANGUAGE_STORAGE_KEY = 'recipely.language.v1';
export const ONBOARDING_SEEN_STORAGE_KEY = 'recipely.onboarding.seen.v1';
export const TIMERS_BAR_COLLAPSED_STORAGE_KEY = 'recipely.timers.bar.collapsed.v1';

/**
 * The marker a running foreground session leaves behind, holding the last
 * breadcrumb it reached. Present at launch means the previous session was
 * killed rather than backgrounded — see `crash-sentinel.ts`.
 */
export const CRASH_SENTINEL_STORAGE_KEY = 'recipely.crash.sentinel.v1';
