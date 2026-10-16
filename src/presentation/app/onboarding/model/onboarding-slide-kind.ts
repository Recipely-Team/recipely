/** The four Onboarding 2026 slides, in order (prototype: Onboarding 2026 board). */
export const OnboardingSlideKind = {
  Import: 'import',
  Cook: 'cook',
  Plan: 'plan',
  Fridge: 'fridge',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type OnboardingSlideKind = (typeof OnboardingSlideKind)[keyof typeof OnboardingSlideKind];
