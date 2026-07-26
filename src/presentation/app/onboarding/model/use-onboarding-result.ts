/** Entry actions surfaced by the onboarding welcome screen. */
export interface UseOnboardingResult {
  /** Route to account creation. */
  onSignUp: () => void;
  /** Route to sign in. */
  onSignIn: () => void;
  /** Enter the app as a guest (browse the recipe list). */
  onExplore: () => void;
  /** Persist "don't show again", then enter the app as a guest. */
  onDismiss: () => void;
}
