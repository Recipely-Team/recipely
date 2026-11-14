/**
 * What the backend says the account has, after checking the store.
 *
 * @remarks
 * - **The backend decides, not the device.** The app shows premium only from this
 *   answer; a purchase the store reported is not enough on its own.
 */
export interface PremiumEntitlement {
  readonly isPremium: boolean;
  /** ISO 8601; null when the account is not premium. */
  readonly expiresAt: string | null;
}
