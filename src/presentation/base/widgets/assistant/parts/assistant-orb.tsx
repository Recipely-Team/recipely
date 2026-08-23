import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AssistantOrbAura } from '@presentation/base/widgets/assistant/parts/assistant-orb-aura';
import { AssistantWave } from '@presentation/base/widgets/assistant/parts/assistant-wave';
import { AssistantMascot } from '@presentation/base/widgets/assistant/parts/assistant-mascot';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, colorAlphas, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface AssistantOrbProps {
  status: AssistantStatusType;
  level: number;
  isMuted: boolean;
}

const SVG_SIZE = 100;
const CENTRE = SVG_SIZE / 2;
const HIGHLIGHT_STOPS = ['0.42', '0'] as const;

/**
 * The assistant, as one object.
 *
 * @remarks
 * - **It replaced a panel.** The conversation used to float over the app as
 *   chips and bubbles; the design it now follows puts a single sphere on the
 *   screen instead, because on a phone a persistent panel is a second app and
 *   this is meant to be a presence.
 * - **Every state is legible without reading anything.** It breathes while
 *   idle, swells with the level while speaking, sweeps a light across itself
 *   while connecting, and dims behind a slash when muted — the same facts the
 *   status line carries, for someone glancing from across a kitchen.
 * - **Drawn in SVG, not stacked views.** The sphere is two radial gradients
 *   and two drifting highlights; React Native has no radial gradient and no
 *   blur, so a CSS translation of this design would have been flat circles.
 */
export const AssistantOrb = ({ status, level, isMuted }: AssistantOrbProps): React.JSX.Element => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const speaking = status === AssistantStatus.Speaking && !isMuted;
  const live = assistantIsLive(status);

  const drift = useRef(new Animated.Value(ValueConstants.zero)).current;
  const sweep = useRef(new Animated.Value(ValueConstants.zero)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: ValueConstants.one,
          duration: speaking ? assistantMetrics.orbSpeakingBobMs : assistantMetrics.orbBobMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: ValueConstants.zero,
          duration: speaking ? assistantMetrics.orbSpeakingBobMs : assistantMetrics.orbBobMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, speaking, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || status !== AssistantStatus.Connecting) {
      sweep.setValue(ValueConstants.zero);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: ValueConstants.one,
        duration: assistantMetrics.orbSweepMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, status, reduceMotion]);

  const bob = drift.interpolate({
    inputRange: [ValueConstants.zero, ValueConstants.one],
    outputRange: [ValueConstants.zero, -assistantMetrics.orbBobTravel],
  });

  return (
    <View style={styles.halo} pointerEvents="none">
      {live && !isMuted ? <AssistantOrbAura isSpeaking={speaking} /> : null}
      <Animated.View
        style={[
          styles.orb,
          {
            opacity: isMuted ? opacities.disabledFaint : opacities.full,
            transform: [
              { translateY: bob },
              { scale: speaking ? ValueConstants.one + level * assistantMetrics.orbLevelGrowth : ValueConstants.one },
            ],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          <Defs>
            <RadialGradient id="assistantOrbBody" cx="30%" cy="20%" r="85%">
              <Stop offset="0" stopColor={colors.primaryGradientStart} />
              <Stop offset="1" stopColor={colors.primaryGradientEnd} />
            </RadialGradient>
            <RadialGradient id="assistantOrbLight">
              <Stop offset="0" stopColor={colors.onOverlay} stopOpacity={HIGHLIGHT_STOPS[0]} />
              <Stop offset="1" stopColor={colors.onOverlay} stopOpacity={HIGHLIGHT_STOPS[1]} />
            </RadialGradient>
            <RadialGradient id="assistantOrbShade">
              <Stop offset="0" stopColor={colors.shadow} stopOpacity={HIGHLIGHT_STOPS[0]} />
              <Stop offset="1" stopColor={colors.shadow} stopOpacity={HIGHLIGHT_STOPS[1]} />
            </RadialGradient>
          </Defs>

          <Circle cx={CENTRE} cy={CENTRE} r={CENTRE} fill="url(#assistantOrbBody)" />
          <Circle cx={CENTRE * 0.7} cy={CENTRE * 0.6} r={CENTRE * 0.8} fill="url(#assistantOrbLight)" />
          <Circle cx={CENTRE * 1.4} cy={CENTRE * 1.5} r={CENTRE * 0.7} fill="url(#assistantOrbShade)" />
        </Svg>

        <View style={styles.face}>
          <AssistantMascot
            size={assistantMetrics.orbMascot}
            status={isMuted ? AssistantStatus.Idle : status}
          />
        </View>

        {isMuted ? <View style={[styles.slash, { backgroundColor: colors.onOverlay }]} /> : null}

        {status === AssistantStatus.Connecting ? (
          <Animated.View
            style={[
              styles.sweep,
              {
                backgroundColor: colors.onOverlay + colorAlphas.soft,
                transform: [
                  {
                    translateX: sweep.interpolate({
                      inputRange: [ValueConstants.zero, ValueConstants.one],
                      outputRange: [-assistantMetrics.orb, assistantMetrics.orb],
                    }),
                  },
                  { rotate: '20deg' },
                ],
              },
            ]}
          />
        ) : null}
      </Animated.View>

      {live && !isMuted ? (
        <>
          <View style={[styles.lift, { backgroundColor: colors.primary + colorAlphas.faint }]} />
          <View style={[styles.waveBadge, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <AssistantWave
              level={level}
              active
              color={colors.primary}
              bars={assistantMetrics.orbWaveBars}
              height={assistantMetrics.orbWaveHeight}
            />
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Pinned sizes throughout: this is a shape, not a box with text in it.
  halo: {
    width: assistantMetrics.orbHalo,
    height: assistantMetrics.orbHalo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: assistantMetrics.orb,
    height: assistantMetrics.orb,
    borderRadius: radii.round,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  slash: {
    position: 'absolute',
    width: assistantMetrics.orb * 0.02,
    height: assistantMetrics.orb * 0.72,
    borderRadius: radii.xs,
    transform: [{ rotate: '45deg' }],
  },
  sweep: {
    position: 'absolute',
    width: assistantMetrics.orb * 0.35,
    height: assistantMetrics.orb * 1.6,
  },
  // Sits ON the orb's lower edge: the level belongs to the object making the
  // sound, not to a bar somewhere else on the screen.
  waveBadge: {
    position: 'absolute',
    bottom: ValueConstants.zero,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  lift: {
    position: 'absolute',
    bottom: ValueConstants.zero,
    width: assistantMetrics.orbHalo,
    height: assistantMetrics.orbHalo * 0.5,
    borderRadius: radii.round,
  },
});
