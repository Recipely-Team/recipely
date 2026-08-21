import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AssistantComposer } from '@presentation/base/widgets/assistant/views/assistant-composer';
import { AssistantMascot } from '@presentation/base/widgets/assistant/parts/assistant-mascot';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantTranscript } from '@presentation/base/widgets/assistant/parts/assistant-transcript';
import { AssistantVoiceStage } from '@presentation/base/widgets/assistant/views/assistant-voice-stage';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantGradient, assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { assistantNotice } from '@presentation/base/widgets/assistant/assistant-notice';
import { useAssistantSession } from '@presentation/base/hooks/assistant/use-assistant-session';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface AssistantPanelProps {
  /** Ends the session and puts the assistant away. */
  onClose: () => void;
  /** Puts the panel away while the session keeps running. */
  onMinimize: () => void;
  /** How far the dock sits above the bottom edge, so the column can reach it. */
  bottomOffset: number;
}

/**
 * The assistant's conversation surface.
 *
 * @remarks
 * - **It never covers the screen it is driving.** The whole point of this
 *   assistant is that the app changes where the user can watch, so the panel is
 *   capped at roughly half the height on a phone and takes a column down one
 *   side on a wide window — the create screen filling itself in is the thing
 *   worth seeing, and neither shape hides it.
 * - **The wide shape is a fixed height, not a content height.** Sized by its
 *   contents, an empty conversation collapsed to a strip the size of its own
 *   footer, and the transcript then grew the panel upward line by line as the
 *   session went on.
 * - **Voice and typing are two halves of one panel, not two modes of the app.**
 *   Switching between them keeps the transcript, because a session that started
 *   aloud and continued in text is one conversation.
 * - **Minimising and closing are different decisions, and both are on screen.**
 *   The chevron puts the panel away and leaves the session running; the cross
 *   hangs up. With only a cross, "get this off my screen" ended the call — and
 *   the mini bar, the state this assistant is designed to live in, could not be
 *   reached at all.
 * - **A failed request outranks the status line.** A request answered by
 *   nothing looks exactly like being ignored, and this is the only surface that
 *   can say otherwise.
 */
export const AssistantPanel = ({
  onClose,
  onMinimize,
  bottomOffset,
}: AssistantPanelProps): React.JSX.Element => {
  const { colors } = useTheme();
  const { isExpanded, isWebShell } = useLayout();
  const { height } = useWindowDimensions();
  const {
    status,
    level,
    isMuted,
    transcript,
    deniedReason,
    error,
    clearError,
    toggleMute,
    toggleVoice,
    sendText,
  } = useAssistantSession();
  const [isTyping, setIsTyping] = useState(false);

  const live = status !== AssistantStatus.Idle;
  const notice = error !== null ? t().assistant.requestFailed : assistantNotice(status, deniedReason);

  const send = (text: string): void => {
    clearError();
    sendText(text);
  };

  return (
    <View
      style={[
        styles.panel,
        shadows.lg,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        isExpanded
          ? {
              width: assistantMetrics.panelWebWidth,
              height: Math.max(
                assistantMetrics.panelMinHeight,
                height -
                  (isWebShell ? assistantMetrics.panelWebTopClearance : spacing.xl) -
                  bottomOffset,
              ),
            }
          : { width: '100%', maxHeight: height * assistantMetrics.panelSheetHeightShare },
      ]}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={assistantGradient.start}
          end={assistantGradient.end}
          style={styles.headerMascot}
        >
          <AssistantMascot size={assistantMetrics.headerMascot} status={status} />
        </LinearGradient>

        <ThemedText variant="subtitle" style={styles.title}>
          {t().assistant.title}
        </ThemedText>

        <View
          style={[styles.liveDot, { backgroundColor: live ? colors.success : colors.textMuted }]}
        />

        <Pressable
          onPress={onMinimize}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.minimize}
          style={[styles.round, styles.minimize, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="chevron-down" size={iconSizes.md} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => {
            clearError();
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.close}
          style={[styles.round, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="close" size={iconSizes.md} color={colors.text} />
        </Pressable>
      </View>

      {notice !== null ? (
        <ThemedText variant="caption" muted style={styles.notice}>
          {notice}
        </ThemedText>
      ) : null}

      <View style={styles.transcript}>
        <AssistantTranscript lines={transcript} />
      </View>

      <View style={[styles.stage, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {isTyping ? (
          <AssistantComposer onSend={send} onSwitchToVoice={() => setIsTyping(false)} />
        ) : (
          <AssistantVoiceStage
            status={status}
            level={level}
            isMuted={isMuted}
            onStart={toggleVoice}
            onStop={toggleVoice}
            onToggleMute={toggleMute}
            onSwitchToText={() => setIsTyping(true)}
          />
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  panel: {
    borderRadius: radii.xxl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  // Pinned: circles, not text boxes.
  headerMascot: {
    width: controlSizes.chip,
    height: controlSizes.chip,
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
  },
  minimize: { marginLeft: 'auto' },
  liveDot: { width: spacing.sm, height: spacing.sm, borderRadius: radii.round },
  title: { fontWeight: fontWeights.bold },
  notice: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  // It takes the room the header and the stage do not: the stage belongs at the
  // bottom edge the way a composer does, and left to its content height the
  // transcript pinned both of them to the top of an otherwise empty column.
  transcript: { flex: ValueConstants.one, minHeight: ValueConstants.zero, paddingHorizontal: spacing.md },
  stage: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
});
