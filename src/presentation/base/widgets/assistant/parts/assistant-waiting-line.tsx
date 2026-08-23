import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantStatusLabel } from '@presentation/base/widgets/assistant/assistant-status-label';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { durations, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/** The two states where the user is waiting on something they cannot see. */
const WAITING: readonly AssistantStatusType[] = [AssistantStatus.Connecting, AssistantStatus.Working];
const DOTS = [ValueConstants.zero, ValueConstants.one, ValueConstants.two];
const DOT_STAGGER_MS = 160;

export interface AssistantWaitingLineProps {
  status: AssistantStatusType;
  isMuted?: boolean;
}

/**
 * What the assistant is doing while it cannot yet listen.
 *
 * @remarks
 * - **The gap it fills is real.** Opening a session means minting a token,
 *   opening a socket and starting two audio devices — a second or two in which
 *   the controls said "mute" and "end" for a session that did not exist yet,
 *   and nothing on screen said why nothing was happening.
 * - **It renders nothing the rest of the time.** A permanent status line would
 *   be a label that mostly says what the surface already shows: the orb's own
 *   face, and the waveform, carry listening and speaking better than a word.
 * - **The dots are the only part that is decoration**, so they stop under
 *   Reduce Motion and the sentence stays.
 */
export const AssistantWaitingLine = ({
  status,
  isMuted = false,
}: AssistantWaitingLineProps): React.JSX.Element | null => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(ValueConstants.zero)).current;
  // Muted outranks the rest: it is the one state where the assistant looks
  // alive and is deliberately not hearing anything, and the slash on the orb
  // is the only thing that has been saying so.
  const isMutedLive = isMuted && status !== AssistantStatus.Idle;
  const isWaiting = WAITING.includes(status) || isMutedLive;

  useEffect(() => {
    if (reduceMotion || !isWaiting) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: ValueConstants.one,
        duration: durations.pulse,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, isWaiting, reduceMotion]);

  if (!isWaiting) return null;

  return (
    <View style={[styles.line, { backgroundColor: colors.cardBackground }]}>
      <ThemedText variant="caption" muted style={styles.label}>
        {isMutedLive ? t().assistant.muted : assistantStatusLabel(status)}
      </ThemedText>

      {isMutedLive ? null : (
      <View style={styles.dots}>
        {DOTS.map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: colors.primary,
                opacity: reduceMotion
                  ? opacities.inactive
                  : pulse.interpolate({
                      // Each dot leads the next, so the row reads left to right
                      // rather than blinking as one block.
                      inputRange: [ValueConstants.zero, ValueConstants.one],
                      outputRange: [ValueConstants.zero, ValueConstants.one],
                    }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [
                        ValueConstants.zero,
                        (index * DOT_STAGGER_MS) / durations.pulse,
                        (index * DOT_STAGGER_MS) / durations.pulse + 0.3,
                        ValueConstants.one,
                      ],
                      outputRange: [0.6, 0.6, 1, 0.6],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  label: { fontWeight: fontWeights.semibold },
  dots: { flexDirection: 'row', gap: spacing.xxs },
  // Pinned: dots, not text boxes.
  dot: { width: spacing.xs, height: spacing.xs, borderRadius: radii.round },
});
