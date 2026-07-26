import type { OnboardingSlideKind } from '@presentation/app/onboarding/model/onboarding-slide-kind';

/** A single welcome-carousel slide: an illustrated hero plus its localized copy. */
export interface OnboardingSlide {
  kind: OnboardingSlideKind;
  eyebrow: string;
  title: string;
  body: string;
}
