import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AssistantMascot } from '@presentation/base/widgets/assistant/parts/assistant-mascot';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, opacities, radii } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface AssistantFabProps {
  status: AssistantStatusType;
  onOpen: () => void;
}

/**
 * The assistant at rest: a chef waiting to be asked.
 *
 * @remarks
 * - **A mascot, not an icon.** This control has to be recognisable from across
 *   a kitchen by someone whose hands are covered in flour; a face carries
 *   further than a glyph, and it is the same face that then appears in the
 *   panel, so the user knows they reached the same thing.
 * - **The ring only pulses while idle**, because that is the whole message: it
 *   is available. Once a session is live the FAB is gone — the mini bar has the
 *   floor — so a ring that kept beating would be advertising nothing.
 */
export const AssistantFab = ({ status, onOpen }: AssistantFabProps): React.JSX.Element => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const ring = useRef(new Animated.Value(ValueConstants.zero)).current;
  const idle = status === AssistantStatus.Idle;

  useEffect(() => {
    if (reduceMotion || !idle) {
      ring.setValue(ValueConstants.zero);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: ValueConstants.one,
        duration: assistantMetrics.ringDurationMs,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ring, idle, reduceMotion]);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={t().assistant.open}
      style={styles.wrapper}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderColor: colors.primary,
            opacity: ring.interpolate({
              inputRange: [ValueConstants.zero, ValueConstants.one],
              outputRange: [opacities.scrimStrong, ValueConstants.zero],
            }),
            transform: [
              {
                scale: ring.interpolate({
                  inputRange: [ValueConstants.zero, ValueConstants.one],
                  outputRange: [ValueConstants.one, assistantMetrics.ringScale],
                }),
              },
            ],
          },
        ]}
      />
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={gradientStart}
        end={gradientEnd}
        style={[styles.fab, shadows.lg]}
      >
        <AssistantMascot size={assistantMetrics.fabMascot} status={status} />
      </LinearGradient>
    </Pressable>
  );
};

// Named because a bare pair of coordinate objects inline is exactly the magic
// value rule 5 is about; the diagonal is what gives the button its lit edge.
const gradientStart = { x: 0, y: 0 } as const;
const gradientEnd = { x: 1, y: 1 } as const;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  // Pinned sizes are right here: both are circles, not boxes with text in them.
  fab: {
    width: assistantMetrics.fab,
    height: assistantMetrics.fab,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: assistantMetrics.fab,
    height: assistantMetrics.fab,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
  },
});
