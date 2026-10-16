import { t } from '@presentation/i18n';
import type { OnboardingSlide } from '@presentation/app/onboarding/model/onboarding-slide';
import { OnboardingSlideKind } from '@presentation/app/onboarding/model/onboarding-slide-kind';

/**
 * The slides, each saying something the app does today: save from anywhere,
 * cook hands-free, plan the week, cook with what you have. No counts: a number
 * on these slides needs a source (onboarding-claims.test.ts).
 */
export const buildOnboardingSlides = (): OnboardingSlide[] => {
  const s = t().onboarding.slides;
  return [
    { kind: OnboardingSlideKind.Import, eyebrow: s.importEyebrow, title: s.importTitle, body: s.importBody },
    { kind: OnboardingSlideKind.Cook, eyebrow: s.cookEyebrow, title: s.cookTitle, body: s.cookBody },
    { kind: OnboardingSlideKind.Plan, eyebrow: s.planEyebrow, title: s.planTitle, body: s.planBody },
    { kind: OnboardingSlideKind.Fridge, eyebrow: s.fridgeEyebrow, title: s.fridgeTitle, body: s.fridgeBody },
  ];
};
