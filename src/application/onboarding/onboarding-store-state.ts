/**
 * State for the device-scoped onboarding gate.
 *
 * `dismissed` is the persisted "don't show this page again" choice; `hydrated`
 * flips true once that choice has been read back from storage so the launch
 * redirect can wait for a definitive answer instead of flashing the wrong
 * screen. This flag is a DEVICE preference, not a user-scoped cache — it must
 * survive sign-out, so it is deliberately kept out of `clearSessionCaches`.
 */
export interface OnboardingStoreState {
  hydrated: boolean;
  dismissed: boolean;
  /** Restores the persisted dismissal once, at app bootstrap. Never rejects. */
  hydrate: () => Promise<void>;
  /** Marks onboarding permanently dismissed and persists the choice. */
  dismiss: () => Promise<void>;
}
