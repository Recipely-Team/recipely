export interface UseOnboardingResult {
  onSignUp: () => void;
  onSignIn: () => void;
  /** Straight to the recipes as a guest, and onboarding is not shown again. */
  onSkip: () => void;
}
