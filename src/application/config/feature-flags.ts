/**
 * The one place that turns unfinished features on or off.
 *
 * @remarks
 * - **Off means invisible.** A flagged feature's entry points read its flag
 *   (directly or through the store that feeds them) and render nothing.
 * - **Flip here, ship, done** — no flag lives anywhere else.
 * - `instagramAutomations`: Connect with Instagram + comment-to-DM. Off until
 *   Meta grants Advanced Access (needs a verified business; see
 *   docs/instagram-app-review.md). The manual creator-tag claim stays on.
 */
export const FeatureFlags = {
  instagramAutomations: false,
} as const;
