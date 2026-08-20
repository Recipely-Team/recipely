import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { ChatRole } from '@domain/drafts/chat-role';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AssistantTranscriptProps {
  lines: AssistantTranscriptLine[];
}

/**
 * What was said, both ways.
 *
 * The model answers in audio only, so these lines come from the input and
 * output transcription streams rather than from anything the model wrote —
 * which is why a line can appear a beat after the sound it belongs to.
 */
export const AssistantTranscript = ({ lines }: AssistantTranscriptProps): React.JSX.Element => {
  const { colors } = useTheme();

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
      data={lines}
      // Ids are minted per line and never reused, so this is stable across the
      // re-render every incoming transcript fragment causes.
      keyExtractor={(line) => line.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View
          style={[
            styles.line,
            item.speaker === ChatRole.User
              ? { alignSelf: 'flex-end', backgroundColor: colors.primaryLight }
              : { alignSelf: 'flex-start', backgroundColor: colors.chipBackground },
          ]}
        >
          <ThemedText variant="body">{item.text}</ThemedText>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: { gap: spacing.xs, paddingVertical: spacing.sm },
  line: {
    maxWidth: '85%',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  empty: { paddingVertical: spacing.lg, alignItems: 'center' },
});
