import type { OsIntentLink } from '@presentation/navigation/os-intent-link-shape';

/**
 * Holds the one request a launch URL carried, until the app can run it.
 *
 * @remarks
 * - **`redirectSystemPath` runs before React exists.** expo-router calls it to
 *   rewrite a system URL while the app is still starting, so there is no store
 *   to write to and no hook to call — module scope is the only place the value
 *   can wait. It waits for a few hundred milliseconds at most.
 * - **Taking it clears it.** A shortcut is a request, not a setting: replaying
 *   it on the next remount would re-run an action the user asked for once.
 * - **The last link wins.** Two launches cannot overlap, and a second URL
 *   arriving before the first was consumed means the user tapped again.
 */
let pending: OsIntentLink | null = null;

export const PendingOsIntent = {
  put(link: OsIntentLink): void {
    pending = link;
  },

  take(): OsIntentLink | null {
    const held = pending;
    pending = null;
    return held;
  },
} as const;
