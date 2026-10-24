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
/**
 * Web only: "this browser signed in and has not signed out". Holds no secret —
 * the session itself lives in memory and in the API's HttpOnly cookie — and
 * only spares a guest's page load the refresh call that would answer 401.
 */
export const SIGNED_IN_MARKER_STORAGE_KEY = 'recipely.session.marker.v1';
export const TIMERS_STORAGE_KEY = 'recipely.timers.v1';
export const LANGUAGE_STORAGE_KEY = 'recipely.language.v1';
export const ONBOARDING_SEEN_STORAGE_KEY = 'recipely.onboarding.seen.v1';
export const REMINDERS_CHOICE_STORAGE_KEY = 'recipely.reminders.choice.v1';
export const FIRST_OPEN_AT_STORAGE_KEY = 'recipely.first-open-at.v1';
export const TIMERS_BAR_COLLAPSED_STORAGE_KEY = 'recipely.timers.bar.collapsed.v1';

/**
 * The marker a running foreground session leaves behind, holding the last
 * breadcrumb it reached. Present at launch means the previous session was
 * killed rather than backgrounded — see `crash-sentinel.ts`.
 */
export const CRASH_SENTINEL_STORAGE_KEY = 'recipely.crash.sentinel.v1';

/**
 * This install's device id, minted once. Deliberately NOT cleared on sign-out:
 * it names the install, not the session, so the next account signing in on
 * the same phone is recorded against the same device.
 */
export const DEVICE_ID_STORAGE_KEY = 'recipely.device.id.v1';
/**
 * iOS: the id of this install's registered App Attest key. Names the install,
 * not the session, so it survives sign-out; the key itself never leaves the
 * Secure Enclave.
 */
export const APP_ATTEST_KEY_STORAGE_KEY = 'recipely.attestation.appleKey.v1';
/** The last first page of the recipe feed, shown when the next load of the same query cannot reach the API. */
export const FEED_FIRST_PAGE_STORAGE_KEY = 'recipely.feedFirstPage.v1';
/** The signed-in user's last shopping-list first page, for opening it offline (in a shop with no signal). */
export const SHOPPING_FIRST_PAGE_STORAGE_KEY = 'recipely.shoppingFirstPage.v1';
/** The signed-in user's last saved-recipes first page, for opening it offline. */
export const SAVED_FIRST_PAGE_STORAGE_KEY = 'recipely.savedFirstPage.v1';

/** Persisted copies of one account's data; `SecureTokenStorage.clear()` removes them at sign-out. */
export const USER_SCOPED_STORAGE_KEYS: readonly string[] = [SHOPPING_FIRST_PAGE_STORAGE_KEY, SAVED_FIRST_PAGE_STORAGE_KEY];
