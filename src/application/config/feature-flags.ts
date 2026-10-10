import { FeatureAvailability } from '@application/config/feature-availability';

/**
 * The one place that turns unfinished features on or off.
 *
 * @remarks
 * - **Off means invisible.** A flagged feature's entry points read its flag
 *   (through the store that feeds them) and render nothing.
 * - **`DevOnly`** is resolved against the build variant in DI wiring
 *   (`infrastructure/di/register.ts`), so dev builds test it and production never shows it.
 * - **The admin panel can override any flag** (Feature Flag table, `GET /flags`):
 *   `On`/`Off` there wins for every client; `Default` leaves the value below in
 *   charge. Read through `FeatureFlagResolver`, never this object directly.
 * - `instagramAutomations`: Connect with Instagram + comment-to-DM. Dev only until
 *   Meta grants Advanced Access (needs a verified business; docs/instagram-app-review.md).
 * - `mealPlanner`: the Diary tab's Plan mode and "Add to plan". Dev only until the
 *   backend's `/me/meal-plan` (#392) reaches production, where it would answer 404.
 * - `fridgeToRecipe`: Cook from my fridge (photo → ingredients → ideas → AI recipe). Dev only
 *   while `/fridge/*` is on the dev backend alone; production would answer 404.
 */
export const FeatureFlags = {
  instagramAutomations: FeatureAvailability.DevOnly,
  mealPlanner: FeatureAvailability.DevOnly,
  fridgeToRecipe: FeatureAvailability.DevOnly,
} as const;
