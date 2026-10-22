import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReducedMotion } from 'react-native-reanimated';
import { isWeb } from '@infrastructure/constants/platform';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { upperCase } from '@presentation/i18n/upper-case';
import { t } from '@presentation/i18n';
import { ArtCard } from '@presentation/app/onboarding/items/art-card';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';
import { CharConstants, TimeConstants, ValueConstants } from '@core/constants';

const REPLY_DELAY_MS = 380;
const STEP_DELAY_MS = 560;
const ORB_DELAY_MS = 760;
const TIMER_DELAY_MS = 860;
const BAR_COUNT = 5;
const BAR_WIDTH = 4;
const BAR_HEIGHT = 22;
const BAR_MIN_SCALE = 0.35;
const BAR_HALF_MS = 450;
const BAR_PHASE_MS = 110;
const ORB_SIZE = 56;
/** The timer the art counts down from, in seconds: 24:58. */
const TIMER_START_S = 1498;
const ART_WIDTH = 270;
const pad = (n: number): string => String(n).padStart(ValueConstants.two, CharConstants.zeroDigit);

/** Slide 2, "Cook hands-free": a spoken "next step", the assistant's reply, the step, a live timer. */
export const HeroCook = ({ active = true }: HeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const a = t().onboarding.art;
  const reducedMotion = useReducedMotion();
  const [left, setLeft] = useState(TIMER_START_S);

  useEffect(() => {
    setLeft(TIMER_START_S);
    if (!active || reducedMotion) return;
    const id = setInterval(() => setLeft((s) => Math.max(ValueConstants.zero, s - ValueConstants.one)), TimeConstants.millisecondsPerSecond);
    return () => clearInterval(id);
  }, [active, reducedMotion]);

  return (
    <View style={styles.root}>
      <OnboardingReveal active={active} delay={ValueConstants.zero} style={[styles.bubble, styles.said, { backgroundColor: colors.primary }]}>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={colors.primaryText}>{a.said}</SizedText>
      </OnboardingReveal>
      <OnboardingReveal active={active} delay={REPLY_DELAY_MS} style={[styles.bubble, { backgroundColor: colors.chipBackground }]}>
        <SizedText size={fontSizes.caption} color={colors.chipText}>{a.reply}</SizedText>
      </OnboardingReveal>
      <ArtCard active={active} delay={STEP_DELAY_MS}>
        <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.primary}>{upperCase(a.stepLabel)}</SizedText>
        <SizedText size={fontSizes.body} weight={fontWeights.semibold}>{a.step}</SizedText>
      </ArtCard>
      <View style={styles.bottomRow}>
        <OnboardingReveal active={active} delay={ORB_DELAY_MS} style={[styles.orb, { backgroundColor: colors.primary }]}>
          <Waveform color={colors.primaryText} running={active && !reducedMotion} />
        </OnboardingReveal>
        <ArtCard active={active} delay={TIMER_DELAY_MS} style={styles.timer}>
          <Ionicons name="timer-outline" size={iconSizes.md} color={colors.primary} />
          <View>
            <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.textMuted}>{upperCase(a.timerLabel)}</SizedText>
            <SizedText size={fontSizes.subheading} weight={fontWeights.heavy} style={styles.digits}>
              {`${pad(Math.floor(left / TimeConstants.secondsPerMinute))}:${pad(left % TimeConstants.secondsPerMinute)}`}
            </SizedText>
          </View>
        </ArtCard>
      </View>
    </View>
  );
};

/** Five bars breathing out of phase: the assistant listening. Static with reduced motion. */
const Waveform = ({ color, running }: { color: string; running: boolean }): React.JSX.Element => {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(ValueConstants.one))).current;
  useEffect(() => {
    if (!running) return;
    const loops = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * BAR_PHASE_MS),
          Animated.timing(bar, { toValue: BAR_MIN_SCALE, duration: BAR_HALF_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: !isWeb() }),
          Animated.timing(bar, { toValue: ValueConstants.one, duration: BAR_HALF_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: !isWeb() }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [bars, running]);
  return (
    <View style={styles.wave}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[styles.bar, { backgroundColor: color, transform: [{ scaleY: bar }] }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { width: ART_WIDTH, gap: spacing.sm },
  bubble: { maxWidth: '85%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.xl },
  said: { alignSelf: 'flex-end' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orb: { width: ORB_SIZE, height: ORB_SIZE, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  timer: { flex: ValueConstants.one, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  digits: { fontVariant: ['tabular-nums'] },
  wave: { flexDirection: 'row', alignItems: 'center', gap: BAR_WIDTH / ValueConstants.two },
  bar: { width: BAR_WIDTH, height: BAR_HEIGHT, borderRadius: BAR_WIDTH },
});
