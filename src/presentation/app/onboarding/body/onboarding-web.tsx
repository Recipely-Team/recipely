import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, letterSpacings, iconSizes, layoutSizes, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { OnboardingHero } from '@presentation/app/onboarding/items/onboarding-hero';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import { OnboardingDots } from '@presentation/app/onboarding/items/onboarding-dots';
import { OnboardingActions } from '@presentation/app/onboarding/items/onboarding-actions';
import type { OnboardingSlide as OnboardingSlideModel } from '@presentation/app/onboarding/model/onboarding-slide';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';

const LOGO_SIZE = 30;
const COLUMN_MAX = 460;
const CONTENT_MAX = 1120;
const TWO_COL_MIN = 900;
const ARROW_SIZE = 40;
const HERO_MAX_HEIGHT = 620;

export interface OnboardingWebProps {
  slides: OnboardingSlideModel[];
  actions: UseOnboardingResult;
}

/** Two-column desktop welcome screen: copy + actions beside a large gradient hero. */
export const OnboardingWeb = ({ slides, actions }: OnboardingWebProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(ValueConstants.zero);
  const stacked = width < TWO_COL_MIN;

  const slide = slides[index];
  const atStart = index === ValueConstants.zero;
  const atEnd = index === slides.length - ValueConstants.one;
  const step = (delta: number): void => {
    setIndex((i) => Math.min(slides.length - ValueConstants.one, Math.max(ValueConstants.zero, i + delta)));
  };

  const arrows: { icon: 'chevron-back' | 'chevron-forward'; delta: number; disabled: boolean; label: string }[] = [
    { icon: 'chevron-back', delta: -1, disabled: atStart, label: t().onboarding.previousSlide },
    { icon: 'chevron-forward', delta: 1, disabled: atEnd, label: t().onboarding.nextSlide },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.grid, stacked ? styles.gridStacked : styles.gridRow, { maxWidth: CONTENT_MAX }]}>
        <View style={[styles.copyCol, stacked ? styles.copyColStacked : null]}>
          <View style={styles.brand}>
            <RecipelyLogo size={LOGO_SIZE} />
            <ThemedText style={styles.wordmark}>Recipely</ThemedText>
          </View>

          <OnboardingReveal key={index} style={styles.copyBlock}>
            <View style={[styles.eyebrow, { backgroundColor: colors.chipBackground }]}>
              <ThemedText style={[styles.eyebrowText, { color: colors.chipText }]}>
                {upperCase(slide.eyebrow)}
              </ThemedText>
            </View>
            <ThemedText style={styles.title}>{slide.title}</ThemedText>
            <ThemedText muted style={styles.body}>
              {slide.body}
            </ThemedText>
          </OnboardingReveal>

          <View style={styles.controls}>
            <OnboardingDots count={slides.length} index={index} onSelect={setIndex} />
            <View style={styles.arrows}>
              {arrows.map((arrow) => (
                <Pressable
                  key={arrow.icon}
                  onPress={() => step(arrow.delta)}
                  disabled={arrow.disabled}
                  accessibilityRole="button"
                  accessibilityLabel={arrow.label}
                  style={[
                    styles.arrowBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      opacity: arrow.disabled ? opacities.inactive : opacities.full,
                    },
                  ]}
                >
                  <Ionicons name={arrow.icon} size={iconSizes.xl} color={colors.text} />
                </Pressable>
              ))}
            </View>
          </View>

          <OnboardingActions web {...actions} />
        </View>

        <View style={[styles.heroCol, stacked ? styles.heroColStacked : null]}>
          <OnboardingHero key={index} kind={slide.kind} web style={styles.hero} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
  },
  grid: {
    width: '100%',
    gap: spacing.xxxl,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridStacked: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },
  copyCol: {
    flex: ValueConstants.one,
    maxWidth: COLUMN_MAX,
    gap: spacing.lg,
  },
  copyBlock: {
    gap: spacing.md,
  },
  copyColStacked: {
    maxWidth: CONTENT_MAX,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
    marginBottom: spacing.sm,
  },
  wordmark: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  eyebrowText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.subtle,
  },
  title: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tightest,
    lineHeight: lineHeightFor(fontSizes.hero, lineHeights.tight),
  },
  body: {
    fontSize: fontSizes.subtitle,
    lineHeight: lineHeightFor(fontSizes.subtitle, lineHeights.relaxed),
    maxWidth: layoutSizes.maxContentLg,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  arrows: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  arrowBtn: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCol: {
    flex: ValueConstants.one,
    height: HERO_MAX_HEIGHT,
  },
  heroColStacked: {
    height: HERO_MAX_HEIGHT,
    flex: ValueConstants.zero,
  },
  hero: {
    flex: ValueConstants.one,
  },
});
