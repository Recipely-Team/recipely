import { StyleSheet, Text } from 'react-native';
import { AssistantStatus, EndReason } from '@live-assistant/core';
import type { AssistantState } from '@live-assistant/core';
import { useAssistantState } from '@live-assistant/react';
import { useWidgetStrings } from '../strings/widget-strings-context';
import { useWidgetTheme } from '../theme/widget-theme-context';

const selectStatus = (state: AssistantState) => state.status;
const selectError = (state: AssistantState) => state.error;
const selectEndReason = (state: AssistantState) => state.endReason;
const SMALLER = 0.85;

/**
 * One line saying what the assistant is doing — or why it stopped. A failure
 * wins over the status, and an ended session says why it ended unless the user
 * ended it themselves.
 */
export function StatusLine() {
  const theme = useWidgetTheme();
  const strings = useWidgetStrings();
  const status = useAssistantState(selectStatus);
  const error = useAssistantState(selectError);
  const endReason = useAssistantState(selectEndReason);

  const ended = status === AssistantStatus.Idle && endReason !== null && endReason !== EndReason.Stopped;
  const text =
    error !== null
      ? (strings.errors[error.code] ?? strings.genericError)
      : ended
        ? (strings.ended[endReason] ?? strings.status[status])
        : strings.status[status];

  return (
    <Text
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={[styles.line, { color: error !== null ? theme.colors.danger : theme.colors.mutedText, fontSize: theme.fontSize * SMALLER }]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { textAlign: 'center' },
});
