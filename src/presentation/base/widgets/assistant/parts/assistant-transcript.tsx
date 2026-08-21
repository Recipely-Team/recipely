import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AssistantActionChip } from '@presentation/base/widgets/assistant/parts/assistant-action-chip';
import { AssistantBubble } from '@presentation/base/widgets/assistant/parts/assistant-bubble';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { radii, spacing } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AssistantTranscriptProps {
  lines: AssistantTranscriptLine[];
}

/**
 * What was said, and what was done.
 *
 * @remarks
 * - **Two kinds of line, one thread.** Speech comes from the input and output
 *   transcription streams, so a line can appear a beat after the sound it
 *   belongs to; an action line is the app reporting a change it already made.
 *   Interleaving them is what makes the record answer "and then what happened".
 * - **It is as tall as the conversation, no taller.** There is no panel behind
 *   this; it floats over the app. A list stretched to fill the overlay caught
 *   every touch in the clear space above the turns, which is the space the user
 *   is looking through to work.
 * - **It follows the tail.** A hands-free user is not going to scroll, so a new
 *   line that lands below the fold is a line they never receive.
 */
export const AssistantTranscript = ({ lines }: AssistantTranscriptProps): React.JSX.Element => {
  const { colors } = useTheme();
  const list = useRef<FlatList<AssistantTranscriptLine>>(null);

  const follow = useCallback(() => {
    list.current?.scrollToEnd({ animated: true });
  }, []);

  if (lines.length === ValueConstants.zero) {
    return (
      <View style={styles.emptyRow}>
        <View style={[styles.empty, shadows.md, { backgroundColor: colors.cardBackground }]}>
          <ThemedText variant="body">{t().assistant.empty}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      ref={list}
      data={lines}
      // Ids are minted per line and never reused, so this is stable across the
      // re-render every incoming transcript fragment causes.
      keyExtractor={(line) => line.id}
      style={styles.list}
      contentContainerStyle={styles.content}
      onContentSizeChange={follow}
      renderItem={({ item }) =>
        item.kind === AssistantTranscriptLineKind.Action ? (
          <AssistantActionChip action={item.action} detail={item.detail} />
        ) : (
          <AssistantBubble speaker={item.speaker} text={item.text} />
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  // A scrolling list cannot be transparent to touches in its own gaps, and
  // ScrollView's base style is `flexGrow: 1` — so left to itself it filled the
  // whole overlay and intercepted every tap meant for the screen underneath,
  // including the empty space above the conversation. Sized to its turns, it
  // covers only where there is something to read.
  list: { flexGrow: ValueConstants.zero },
  content: { gap: spacing.sm, paddingVertical: spacing.sm },
  emptyRow: { alignItems: 'center' },
  // It floats over the app like everything else here, so it needs its own
  // ground: laid bare over a recipe photo the invitation was unreadable.
  empty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.round,
  },
});
