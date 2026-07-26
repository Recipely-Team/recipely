import { t } from '@presentation/i18n';
import type { OnboardingSlide } from '@presentation/app/onboarding/model/onboarding-slide';

/**
 * Builds the three welcome slides from the active translations. A plain builder
 * (not a constant) so the copy re-reads on every language switch.
 */
export const buildOnboardingSlides = (): OnboardingSlide[] => {
  const s = t().onboarding.slides;
  return [
    { kind: 'recipes', eyebrow: s.recipesEyebrow, title: s.recipesTitle, body: s.recipesBody },
    { kind: 'ai', eyebrow: s.aiEyebrow, title: s.aiTitle, body: s.aiBody },
    { kind: 'timer', eyebrow: s.timerEyebrow, title: s.timerTitle, body: s.timerBody },
  ];
};
