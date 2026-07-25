import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, letterSpacings } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';
import { ValueConstants } from '@core/constants';

const RING_DELAY_MS = 40;
const STEPS_DELAY_MS = 220;
const RING_SIZE = 120;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 46;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_PROGRESS = 0.68;
const CHECK_DOT = 20;
const CARD_WIDTH = 210;
/** Decorative countdown face — a locale-neutral mm:ss display, not translatable. */
const TIMER_FACE = '04:12';

/** Floating "cook with timers" illustration: a progress ring above a step checklist. */
export const HeroTimer = ({ active = true }: HeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const m = t().onboarding.mock;
  const steps = [
    { label: m.stepOne, done: true },
    { label: m.stepTwo, done: true },
    { label: m.stepThree, done: false },
  ];

  return (
    <View style={styles.root}>
      <OnboardingReveal
        active={active}
        delay={RING_DELAY_MS}
        float
        style={[
          styles.ringCard,
          shadows.lg,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              stroke={colors.cardBorder}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              stroke={colors.primary}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - RING_PROGRESS)}
              originX={RING_CENTER}
              originY={RING_CENTER}
              rotation={-90}
            />
          </Svg>
          <View style={styles.ringLabel}>
            <ThemedText style={styles.ringTime}>{TIMER_FACE}</ThemedText>
            <ThemedText muted style={styles.ringCaption}>
              {m.timerLabel}
            </ThemedText>
          </View>
        </View>
      </OnboardingReveal>

      <OnboardingReveal
        active={active}
        delay={STEPS_DELAY_MS}
        style={[
          styles.stepCard,
          shadows.lg,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        {steps.map((step) => (
          <View key={step.label} style={styles.stepRow}>
            <View
              style={[
                styles.checkDot,
                step.done
                  ? { backgroundColor: colors.primary }
                  : { borderColor: colors.cardBorder, borderWidth: 2 },
              ]}
            >
              {step.done ? (
                <Ionicons name="checkmark" size={fontSizes.small} color={colors.primaryText} />
              ) : null}
            </View>
            <ThemedText
              muted={step.done}
              style={[styles.stepLabel, step.done ? styles.stepDone : null]}
            >
              {step.label}
            </ThemedText>
          </View>
        ))}
      </OnboardingReveal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  ringCard: {
    padding: spacing.lg,
    borderRadius: radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTime: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
    fontVariant: ['tabular-nums'],
  },
  ringCaption: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  stepCard: {
    width: CARD_WIDTH,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
  },
  checkDot: {
    width: CHECK_DOT,
    height: CHECK_DOT,
    borderRadius: CHECK_DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: ValueConstants.one,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  stepDone: {
    textDecorationLine: 'line-through',
  },
});
