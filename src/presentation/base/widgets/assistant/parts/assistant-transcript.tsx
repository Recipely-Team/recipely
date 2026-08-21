import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { AssistantActionChip } from '@presentation/base/widgets/assistant/parts/assistant-action-chip';
import { AssistantBubble } from '@presentation/base/widgets/assistant/parts/assistant-bubble';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing } from '@presentation/base/theme';
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
 * - **It follows the tail.** A hands-free user is not going to scroll, so a new
 *   line that lands below the fold is a line they never receive.
 */
export const AssistantTranscript = ({ lines }: AssistantTranscriptProps): React.JSX.Element => {
  const list = useRef<FlatList<AssistantTranscriptLine>>(null);

  const follow = useCallback(() => {
    list.current?.scrollToEnd({ animated: true });
  }, []);

  if (lines.length === ValueConstants.zero) {
    return (
      <View style={styles.empty}>
        <ThemedText variant="body" muted>
          {t().assistant.empty}
        </ThemedText>
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
      contentContainerStyle={styles.list}
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
  list: { gap: spacing.sm, paddingVertical: spacing.sm },
  empty: { paddingVertical: spacing.lg, alignItems: 'center' },
});
