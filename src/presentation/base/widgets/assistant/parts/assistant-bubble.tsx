import { StyleSheet, View } from 'react-native';
import { AssistantMascot } from '@presentation/base/widgets/assistant/parts/assistant-mascot';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { ChatRole } from '@domain/drafts/chat-role';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, radii, spacing } from '@presentation/base/theme';

export interface AssistantBubbleProps {
  speaker: ChatRole;
  text: string;
}

/**
 * One spoken turn.
 *
 * @remarks
 * - **The assistant's side carries the mascot; the user's does not.** With both
 *   sides bare, a transcript of short turns read as one voice — and the side a
 *   user checks is the assistant's, because that is the one they may have
 *   misheard over a running extractor fan.
 * - **The tail corner marks the speaker even without colour**, which is what
 *   keeps the two sides apart for a user who cannot rely on the primary hue.
 */
export const AssistantBubble = ({ speaker, text }: AssistantBubbleProps): React.JSX.Element => {
  const { colors } = useTheme();
  const mine = speaker === ChatRole.User;

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      {!mine ? (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <AssistantMascot size={assistantMetrics.bubbleMascot} status={AssistantStatus.Idle} />
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: colors.primary, borderBottomRightRadius: radii.xs }
            : {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
                borderWidth: borderWidths.hairline,
                borderBottomLeftRadius: radii.xs,
              },
        ]}
      >
        <ThemedText variant="body" style={mine ? { color: colors.primaryText } : undefined}>
          {text}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  // A pinned size is right here: the avatar is a shape, not a box with text.
  avatar: {
    width: assistantMetrics.bubbleMascot + spacing.xs,
    height: assistantMetrics.bubbleMascot + spacing.xs,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
