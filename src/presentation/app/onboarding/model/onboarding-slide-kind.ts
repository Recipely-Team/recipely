/** Which illustrated hero a welcome slide renders. */
export const OnboardingSlideKind = {
  Recipes: 'recipes',
  Ai: 'ai',
  Timer: 'timer',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type OnboardingSlideKind = (typeof OnboardingSlideKind)[keyof typeof OnboardingSlideKind];
