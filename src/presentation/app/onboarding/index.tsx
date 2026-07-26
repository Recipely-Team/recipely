import { useLayout } from '@presentation/base/responsive/use-layout';
import { useLocale } from '@presentation/i18n';
import { buildOnboardingSlides } from '@presentation/app/onboarding/model/build-onboarding-slides';
import { useOnboarding } from '@presentation/app/onboarding/hooks/use-onboarding';
import { OnboardingMobile } from '@presentation/app/onboarding/body/onboarding-mobile';
import { OnboardingWeb } from '@presentation/app/onboarding/body/onboarding-web';

/**
 * Guest welcome gate. Native guests reach it from the launch redirect on every
 * cold start until they sign in or dismiss it; web guests open it from the
 * Discover entry in the recipes header. Renders the roomy two-column layout on
 * the web shell and the swipeable carousel on phones.
 */
export const OnboardingScreen = (): React.JSX.Element => {
  useLocale(); // re-read slide copy when the language changes
  const { isWebShell } = useLayout();
  const slides = buildOnboardingSlides();
  const actions = useOnboarding();

  return isWebShell ? (
    <OnboardingWeb slides={slides} actions={actions} />
  ) : (
    <OnboardingMobile slides={slides} actions={actions} />
  );
};

export default OnboardingScreen;
