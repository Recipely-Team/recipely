import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { upperCase } from '@presentation/i18n/upper-case';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, letterSpacings, layoutSizes } from '@presentation/base/theme';
import { OnboardingHero } from '@presentation/app/onboarding/items/onboarding-hero';
import type { OnboardingSlide as OnboardingSlideModel } from '@presentation/app/onboarding/model/onboarding-slide';
import { ValueConstants } from '@core/constants';

export interface OnboardingSlideProps {
  slide: OnboardingSlideModel;
  /** Carousel page width so horizontal paging snaps cleanly. */
  width: number;
  /** Carousel page height — a definite height so the flex hero cannot collapse
   * inside the horizontal ScrollView. */
  height: number;
  /** Whether this page is the one currently in view — replays its entrance. */
  active: boolean;
}

/** One full-width carousel page: the gradient hero above the slide's copy. */
export const OnboardingSlide = ({ slide, width, height, active }: OnboardingSlideProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.page, { width, height }]}>
      <OnboardingHero kind={slide.kind} active={active} style={styles.hero} />
      <View style={styles.copy}>
        <View style={[styles.eyebrow, { backgroundColor: colors.chipBackground }]}>
          <ThemedText style={[styles.eyebrowText, { color: colors.chipText }]}>
            {upperCase(slide.eyebrow)}
          </ThemedText>
        </View>
        <ThemedText style={styles.title}>{slide.title}</ThemedText>
        <ThemedText muted style={styles.body}>
          {slide.body}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.lg2,
  },
  hero: {
    flex: ValueConstants.one,
  },
  copy: {
    paddingTop: spacing.lg2,
    paddingBottom: spacing.xs2,
    gap: spacing.md,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  eyebrowText: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.subtle,
  },
  title: {
    fontSize: fontSizes.headline,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
    lineHeight: lineHeightFor(fontSizes.headline, lineHeights.tight),
  },
  body: {
    fontSize: fontSizes.heading,
    lineHeight: lineHeightFor(fontSizes.heading),
    maxWidth: layoutSizes.maxContentMd,
  },
});
