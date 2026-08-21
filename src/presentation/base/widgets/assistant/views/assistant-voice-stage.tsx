import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { AssistantWave } from '@presentation/base/widgets/assistant/parts/assistant-wave';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantGradient, assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  borderWidths,
  controlSizes,
  fontWeights,
  iconSizes,
  radii,
  spacing,
} from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';

export interface AssistantVoiceStageProps {
  status: AssistantStatusType;
  level: number;
  isMuted: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  onSwitchToText: () => void;
}

/**
 * The panel's voice half: the microphone, and the two ways out of it.
 *
 * @remarks
 * - **The bars are the whole readout.** An earlier halo behind them was a
 *   second drawing of one signal, and it pushed the controls far enough down
 *   the screen that the bar stopped reading as a bar.
 * - **Starting is one big target; stopping is three small ones.** Before a
 *   session the only thing to do is begin, so the button takes the width. Once
 *   live, the controls are peers — keyboard, mute, end — and none of them may
 *   be the accidental tap.
 */
export const AssistantVoiceStage = ({
  status,
  level,
  isMuted,
  onStart,
  onStop,
  onToggleMute,
  onSwitchToText,
}: AssistantVoiceStageProps): React.JSX.Element => {
  const { colors } = useTheme();
  const live = status !== AssistantStatus.Idle;
  // Mute silences the microphone, not the assistant. While it is mid-sentence
  // the bars are drawing ITS voice, and flattening them there claimed the
  // session had gone quiet when it had not.
  const isSounding = live && (!isMuted || status === AssistantStatus.Speaking);

  return (
    <View style={styles.stage}>
      <View style={styles.waveRow}>
        <AssistantWave
          level={level}
          active={isSounding}
          color={colors.primary}
          bars={assistantMetrics.wavePanelBars}
          height={assistantMetrics.wavePanelHeight}
        />
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={onSwitchToText}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.keyboard}
          style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={iconSizes.sm} color={colors.text} />
          <ThemedText variant="caption" style={styles.pillLabel}>
            {t().assistant.keyboard}
          </ThemedText>
        </Pressable>

        {live ? (
          <>
            <Pressable
              onPress={onToggleMute}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? t().assistant.unmute : t().assistant.mute}
              style={[
                styles.pill,
                {
                  backgroundColor: isMuted ? colors.primary : colors.surface,
                  borderColor: isMuted ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={iconSizes.sm}
                color={isMuted ? colors.primaryText : colors.text}
              />
              <ThemedText
                variant="caption"
                style={[styles.pillLabel, isMuted ? { color: colors.primaryText } : undefined]}
              >
                {isMuted ? t().assistant.unmute : t().assistant.mute}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={onStop}
              accessibilityRole="button"
              accessibilityLabel={t().assistant.end}
              style={[styles.pill, { backgroundColor: colors.danger, borderColor: colors.danger }]}
            >
              <ThemedText variant="caption" style={[styles.pillLabel, { color: colors.onOverlay }]}>
                {t().assistant.end}
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={onStart} accessibilityRole="button" accessibilityLabel={t().assistant.start}>
            <LinearGradient
              colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
              start={assistantGradient.start}
              end={assistantGradient.end}
              style={[styles.startButton, shadows.md]}
            >
              <Ionicons name="sparkles" size={iconSizes.lg} color={colors.onOverlay} />
              <ThemedText variant="body" style={[styles.startLabel, { color: colors.onOverlay }]}>
                {t().assistant.start}
              </ThemedText>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  stage: { alignItems: 'center', gap: spacing.sm },
  waveRow: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  pillLabel: { fontWeight: fontWeights.semibold },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.button,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.round,
  },
  startLabel: { fontWeight: fontWeights.bold },
});
