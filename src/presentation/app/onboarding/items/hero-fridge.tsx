import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { isWeb } from '@infrastructure/constants/platform';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { BrandColors, fontSizes, fontWeights, radii, spacing, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ArtCard } from '@presentation/app/onboarding/items/art-card';
import { ArtChip } from '@presentation/app/onboarding/items/art-chip';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';
import { ValueConstants } from '@core/constants';

/** Found ingredients pop in: the first at 420 ms, then every 180 ms. */
const CHIP_DELAY_START_MS = 420;
const CHIP_DELAY_STEP_MS = 180;
const IDEA_DELAY_MS = 1150;
const LOGGED_DELAY_MS = 1400;
const SCAN_HALF_MS = 1300;
/** The scan line sweeps between 10% and 84% of the frame. */
const SCAN_TOP = 0.1;
const SCAN_BOTTOM = 0.84;
const SCAN_HEIGHT = 2;
/** The scan line glows rather than slices: mostly opaque `primary`. */
const SCAN_OPACITY = 0.85;
const VIEWFINDER_HEIGHT = 170;
const ART_WIDTH = 270;

/** Slide 4, "Cook with what you have": a fridge scan finding ingredients, an idea that uses them, the meal logged. */
export const HeroFridge = ({ active = true }: HeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const a = t().onboarding.art;
  const reducedMotion = useReducedMotion();
  const [frameHeight, setFrameHeight] = useState(ValueConstants.zero);
  const sweep = useRef(new Animated.Value(ValueConstants.zero)).current;

  useEffect(() => {
    if (!active || reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: ValueConstants.one, duration: SCAN_HALF_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: !isWeb() }),
        Animated.timing(sweep, { toValue: ValueConstants.zero, duration: SCAN_HALF_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: !isWeb() }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reducedMotion, sweep]);

  const translateY = sweep.interpolate({
    inputRange: [ValueConstants.zero, ValueConstants.one],
    outputRange: [frameHeight * SCAN_TOP, frameHeight * SCAN_BOTTOM],
  });

  return (
    <View style={styles.root}>
      <OnboardingReveal active={active} delay={ValueConstants.zero}>
        <View
          style={[styles.viewfinder, { backgroundColor: BrandColors.viewfinder }]}
          onLayout={(e: LayoutChangeEvent) => setFrameHeight(e.nativeEvent.layout.height)}
        >
          {reducedMotion ? null : (
            <Animated.View style={[styles.scan, { backgroundColor: colors.primary, transform: [{ translateY }] }]} />
          )}
          <View style={styles.found}>
            {[a.found1, a.found2, a.found3, a.found4].map((item, i) => (
              <OnboardingReveal key={item} active={active} delay={CHIP_DELAY_START_MS + i * CHIP_DELAY_STEP_MS}>
                <View style={[styles.foundChip, { backgroundColor: BrandColors.white }]}>
                  <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={BrandColors.viewfinderInk}>{item}</SizedText>
                </View>
              </OnboardingReveal>
            ))}
          </View>
        </View>
      </OnboardingReveal>
      <ArtCard active={active} delay={IDEA_DELAY_MS}>
        <SizedText size={fontSizes.body} weight={fontWeights.bold}>{a.idea}</SizedText>
        <View style={styles.ideaRow}>
          <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.grow}>{a.uses}</SizedText>
          <ArtChip label={a.logged} active={active} delay={LOGGED_DELAY_MS} strong />
        </View>
      </ArtCard>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { width: ART_WIDTH, gap: spacing.md },
  viewfinder: {
    height: VIEWFINDER_HEIGHT,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    borderColor: BrandColors.viewfinderInk,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  scan: { position: 'absolute', left: ValueConstants.zero, right: ValueConstants.zero, top: ValueConstants.zero, height: SCAN_HEIGHT, opacity: SCAN_OPACITY },
  found: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  foundChip: { paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radii.round },
  ideaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: ValueConstants.one },
});
