import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { AssistantStatus, smoothLevel } from '@live-assistant/core';
import { useAssistantState, useLevelFrames } from '@live-assistant/react';
import type { AssistantState } from '@live-assistant/core';
import { useWidgetTheme } from '../theme/widget-theme-context';
import { useWidgetStrings } from '../strings/widget-strings-context';
import { OrbMotion } from './orb-motion';

export interface AssistantOrbProps {
  /** Defaults to start when idle, stop when live. */
  readonly onPress?: () => void;
  readonly size?: number;
}

const selectStatus = (state: AssistantState) => state.status;
const selectMuted = (state: AssistantState) => state.isMuted;
const PULSING: readonly string[] = [AssistantStatus.Connecting, AssistantStatus.Thinking, AssistantStatus.Working];
const HALF = 2;
const REST = 1;

/**
 * The assistant as one object: a core that moves with both voices.
 *
 * @remarks
 * - **Two voices, two shapes.** A glow behind the core follows the assistant's
 *   voice (what is being heard); a ring around it follows the user's. Someone
 *   glancing across a room can tell who is talking without reading anything.
 * - **Levels drive `Animated.Value`s, never state.** `useLevelFrames` writes
 *   eased levels into the values on every frame; the component renders only
 *   when the status or mute changes.
 * - **Reduce Motion is honoured.** With it on the orb keeps its colours and
 *   stops moving.
 */
export function AssistantOrb({ onPress, size }: AssistantOrbProps) {
  const theme = useWidgetTheme();
  const strings = useWidgetStrings();
  const status = useAssistantState(selectStatus);
  const isMuted = useAssistantState(selectMuted);
  const diameter = size ?? theme.orbSize;
  const [reduceMotion, setReduceMotion] = useState(false);

  const glow = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(REST)).current;
  const eased = useRef({ input: 0, output: 0 });

  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => live && setReduceMotion(enabled));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      live = false;
      subscription.remove();
    };
  }, []);

  useLevelFrames((levels, elapsed) => {
    if (reduceMotion) return;
    eased.current = {
      input: smoothLevel(eased.current.input, levels.input, elapsed),
      output: smoothLevel(eased.current.output, levels.output, elapsed),
    };
    glow.setValue(eased.current.output);
    ring.setValue(eased.current.input);
  });

  useEffect(() => {
    if (reduceMotion || !PULSING.includes(status)) {
      pulse.setValue(REST);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: OrbMotion.pulseLow, duration: OrbMotion.pulseMs, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: REST, duration: OrbMotion.pulseMs, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion, status]);

  const isIdle = status === AssistantStatus.Idle;
  const circle = { width: diameter, height: diameter, borderRadius: diameter / HALF };
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [REST, REST + OrbMotion.assistantGlowGrowth] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [REST, REST + OrbMotion.userRingGrowth] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isIdle ? strings.start : strings.stop}
      accessibilityHint={strings.status[status]}
      onPress={onPress}
      style={[styles.hit, { width: diameter, height: diameter }]}
    >
      <Animated.View
        style={[styles.layer, circle, { backgroundColor: theme.colors.assistantGlow, opacity: isIdle ? 0 : OrbMotion.glowOpacity, transform: [{ scale: glowScale }] }]}
      />
      <Animated.View
        style={[styles.layer, circle, { borderColor: theme.colors.userGlow, borderWidth: OrbMotion.ringBorder, opacity: isIdle || isMuted ? 0 : OrbMotion.ringOpacity, transform: [{ scale: ringScale }] }]}
      />
      <Animated.View style={[circle, { backgroundColor: theme.colors.primary, opacity: Animated.multiply(pulse, isMuted ? OrbMotion.mutedOpacity : REST) }]}>
        <View style={styles.fill} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', pointerEvents: 'none' },
  fill: { flex: 1 },
});
