import { FeatureAvailability } from '@application/config/feature-availability';

/**
 * The one place that turns unfinished features on or off.
 *
 * @remarks
 * - **Off means invisible.** A flagged feature's entry points read its flag
 *   (through the store that feeds them) and render nothing.
 * - **`DevOnly`** is resolved against the build variant in DI wiring
 *   (`application/di/register.ts`), so dev builds test it and production never shows it.
 * - `instagramAutomations`: Connect with Instagram + comment-to-DM. Dev only until
 *   Meta grants Advanced Access (needs a verified business; docs/instagram-app-review.md).
 */
export const FeatureFlags = {
  instagramAutomations: FeatureAvailability.DevOnly,
} as const;
