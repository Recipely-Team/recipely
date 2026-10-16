import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii } from '@presentation/base/theme';
import { HeroImport } from '@presentation/app/onboarding/items/hero-import';
import { HeroCook } from '@presentation/app/onboarding/items/hero-cook';
import { HeroPlan } from '@presentation/app/onboarding/items/hero-plan';
import { HeroFridge } from '@presentation/app/onboarding/items/hero-fridge';
import { OnboardingSlideKind } from '@presentation/app/onboarding/model/onboarding-slide-kind';
import { ValueConstants } from '@core/constants';

/** The web stage is roomier; the art grows with it, capped as the spec says. */
const HERO_WEB_SCALE = 1.25;

export interface OnboardingHeroProps {
  kind: OnboardingSlideKind;
  web?: boolean;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HeroContent = ({ kind, active }: { kind: OnboardingSlideKind; active: boolean }): React.JSX.Element => {
  if (kind === OnboardingSlideKind.Import) return <HeroImport active={active} />;
  if (kind === OnboardingSlideKind.Cook) return <HeroCook active={active} />;
  if (kind === OnboardingSlideKind.Plan) return <HeroPlan active={active} />;
  return <HeroFridge active={active} />;
};

/**
 * The slide's stage (Onboarding 2026): a `primaryLight` panel, radius 32, with
 * the slide's art centred. The art is decoration for a screen reader; the
 * slide's copy carries the meaning.
 */
export const OnboardingHero = ({ kind, web = false, active = true, style }: OnboardingHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      style={[styles.panel, { backgroundColor: colors.primaryLight }, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={web ? styles.contentWeb : styles.content}>
        <HeroContent kind={kind} active={active} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: ValueConstants.one,
    borderRadius: radii.xxxl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', justifyContent: 'center' },
  contentWeb: { alignItems: 'center', justifyContent: 'center', transform: [{ scale: HERO_WEB_SCALE }] },
});
