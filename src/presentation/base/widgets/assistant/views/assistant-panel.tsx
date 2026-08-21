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
import { assistantGradient } from '@presentation/base/widgets/assistant/assistant-gradient';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { assistantNotice } from '@presentation/base/widgets/assistant/assistant-notice';
import { useAssistantSession } from '@presentation/base/hooks/assistant/use-assistant-session';
import { useLayout } from '@presentation/base/responsive/use-layout';
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
import { CharConstants, ValueConstants } from '@core/constants';
import { IS_DEV_BUILD } from '@infrastructure/constants/build-variant';
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
 * - **It is an overlay, not a sheet.** There is no panel behind the
 *   conversation: a name chip, the turns and one control bar float over the
 *   screen the assistant is driving. An opaque card covered the recipe being
 *   read out and the draft being filled in — the one thing worth watching — and
 *   this assistant exists to change the app in view.
 * - **Every piece carrying text takes a solid surface and a shadow.** Over a
 *   recipe feed the pieces sit on whatever photograph happens to be under them,
 *   and a translucent panel dissolved into a bright one; the empty line had no
 *   surface at all and was simply unreadable. The space BETWEEN the pieces
 *   stays clear and stays tappable, which is what keeps the app usable — that
 *   is the transparency worth having, not transparency in the text.
 * - **Minimising and closing are different decisions, and both are on screen.**
 *   The chevron puts the conversation away and leaves the session running; the
 *   cross hangs up. With only a cross, "get this off my screen" ended the call
 *   — and the mini bar, the state this assistant is designed to live in, could
 *   not be reached at all.
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
  // In the dev build the diagnostic rides along with the line. Two rounds of
  // "it errors and we do not know why" went by with the screen able to say
  // exactly which step failed and choosing not to; the message is a diagnostic
  // and never reaches anyone outside an internal build.
  const notice =
    error !== null
      ? t().assistant.requestFailed + (IS_DEV_BUILD ? CharConstants.middotSpaced + error.message : CharConstants.empty)
      : assistantNotice(status, deniedReason);

  const send = (text: string): void => {
    clearError();
    sendText(text);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
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
          : {
              width: '100%',
              // A height, not a cap: the pieces inside are anchored to its two
              // ends, and shrink-wrapped there is no slack for the clear band
              // to take. The floor is what keeps the controls on screen when a
              // large accessibility font grows the header past the share.
              height: Math.max(
                assistantMetrics.panelMinHeight,
                height * assistantMetrics.panelSheetHeightShare,
              ),
            },
      ]}
    >
      <View pointerEvents="box-none" style={styles.header}>
        <View style={[styles.chip, shadows.md, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={assistantGradient.start}
            end={assistantGradient.end}
            style={styles.headerMascot}
          >
            <AssistantMascot size={assistantMetrics.headerMascot} status={status} />
          </LinearGradient>
          <ThemedText variant="caption" style={styles.title}>
            {t().assistant.title}
          </ThemedText>
          <View style={[styles.liveDot, { backgroundColor: live ? colors.success : colors.textMuted }]} />
        </View>

        <View style={styles.headerSpacer} pointerEvents="none" />

        <Pressable
          onPress={onMinimize}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.minimize}
          style={[styles.round, shadows.md, { backgroundColor: colors.cardBackground }]}
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
          style={[styles.round, shadows.md, { backgroundColor: colors.cardBackground }]}
        >
          <Ionicons name="close" size={iconSizes.md} color={colors.text} />
        </Pressable>
      </View>

      {notice !== null ? (
        <View style={[styles.notice, shadows.md, { backgroundColor: colors.cardBackground }]}>
          <ThemedText variant="caption">{notice}</ThemedText>
        </View>
      ) : null}

      <View style={styles.gap} pointerEvents="none" />

      <View style={styles.transcript} pointerEvents="box-none">
        <AssistantTranscript lines={transcript} />
      </View>

      <View style={[styles.stage, shadows.lg, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
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
  // No surface of its own: the conversation floats over the screen it is
  // driving, and only the pieces carrying text take a background.
  overlay: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerSpacer: { flex: ValueConstants.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.md,
    padding: spacing.xxs,
    borderRadius: radii.round,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: { width: spacing.sm, height: spacing.sm, borderRadius: radii.round },
  title: { fontWeight: fontWeights.bold },
  notice: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  // The clear band between the name chip and the conversation. It takes the
  // slack so the turns sit against the control bar, and it takes no touches, so
  // the screen underneath keeps working where there is nothing to read.
  gap: { flex: ValueConstants.one },
  // Shrinks rather than grows: the turns bound it, and when they outgrow the
  // overlay this is what gives way, not the header or the controls.
  transcript: { flexShrink: ValueConstants.one, minHeight: ValueConstants.zero },
  stage: {
    padding: spacing.md,
    borderRadius: radii.xxl,
    borderWidth: borderWidths.hairline,
  },
});
