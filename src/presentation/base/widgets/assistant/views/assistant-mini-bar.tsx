import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AssistantMascot } from '@presentation/base/widgets/assistant/parts/assistant-mascot';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { AssistantWave } from '@presentation/base/widgets/assistant/parts/assistant-wave';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { assistantStatusLabel } from '@presentation/base/widgets/assistant/assistant-status-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface AssistantMiniBarProps {
  status: AssistantStatusType;
  level: number;
  isMuted: boolean;
  onExpand: () => void;
  onToggleMute: () => void;
  onEnd: () => void;
}

/**
 * The live session, out of the way.
 *
 * @remarks
 * - **This is the state the assistant is designed to live in.** It drives the
 *   app while the user watches the app, so the conversation collapses to a
 *   strip and the screen underneath keeps the floor.
 * - **Mute and end are always one tap away, never behind the panel.** A user
 *   who needs to stop the microphone — someone walked in, the phone rang —
 *   needs it now, and reopening a panel to find the control is the failure.
 * - **The waveform is the proof the microphone is open.** Muted, it flattens;
 *   that is the difference between a control that claims a state and one that
 *   shows it.
 */
export const AssistantMiniBar = ({
  status,
  level,
  isMuted,
  onExpand,
  onToggleMute,
  onEnd,
}: AssistantMiniBarProps): React.JSX.Element => {
  const { colors } = useTheme();
  const live = status !== AssistantStatus.Idle;

  return (
    <View
      style={[
        styles.bar,
        shadows.lg,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      <Pressable onPress={onExpand} accessibilityRole="button" accessibilityLabel={t().assistant.expand}>
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={gradientStart}
          end={gradientEnd}
          style={styles.mascot}
        >
          <AssistantMascot size={assistantMetrics.miniMascot} status={status} />
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel={t().assistant.expand}
        style={styles.status}
      >
        <ThemedText variant="caption" muted numberOfLines={1} style={styles.statusLabel}>
          {assistantStatusLabel(status)}
        </ThemedText>
        <AssistantWave
          level={level}
          active={live && !isMuted}
          color={colors.primary}
          bars={assistantMetrics.waveMiniBars}
          height={assistantMetrics.waveMiniHeight}
        />
      </Pressable>

      <Pressable
        onPress={onToggleMute}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? t().assistant.unmute : t().assistant.mute}
        style={[
          styles.round,
          {
            backgroundColor: isMuted ? colors.primary : colors.surface,
            borderColor: isMuted ? colors.primary : colors.cardBorder,
          },
        ]}
      >
        <Ionicons
          name={isMuted ? 'mic-off' : 'mic'}
          size={iconSizes.md}
          color={isMuted ? colors.primaryText : colors.text}
        />
      </Pressable>

      <Pressable
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel={t().assistant.end}
        style={[styles.round, { backgroundColor: colors.danger, borderColor: colors.danger }]}
      >
        <Ionicons name="close" size={iconSizes.md} color={colors.onOverlay} />
      </Pressable>
    </View>
  );
};

const gradientStart = { x: 0, y: 0 } as const;
const gradientEnd = { x: 1, y: 1 } as const;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    padding: spacing.xs,
  },
  // Pinned: circles, not text boxes.
  mascot: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
  status: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
  statusLabel: { fontWeight: fontWeights.bold },
});
