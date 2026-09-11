import { StyleSheet, View } from 'react-native';
import { useWidgetTheme } from '../theme/widget-theme-context';
import { AssistantTranscript } from '../transcript/assistant-transcript';
import type { AssistantTranscriptProps } from '../transcript/assistant-transcript';
import { AssistantComposer } from './assistant-composer';
import { AssistantControls } from './assistant-controls';
import { StatusLine } from './status-line';

export interface AssistantPanelProps extends AssistantTranscriptProps {
  readonly showTranscript?: boolean;
  readonly showComposer?: boolean;
}

const SHADOW = '0px 4px 12px rgba(0, 0, 0, 0.15)';

/** The live session laid out: status, the conversation, typing, and the controls. */
export function AssistantPanel({ showTranscript = true, showComposer = true, renderMessage, renderTool }: AssistantPanelProps) {
  const theme = useWidgetTheme();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius,
          padding: theme.spacing,
          gap: theme.spacing,
          maxHeight: theme.panelMaxHeight,
        },
      ]}
    >
      <StatusLine />
      {showTranscript ? (
        <View style={styles.transcript}>
          <AssistantTranscript renderMessage={renderMessage} renderTool={renderTool} />
        </View>
      ) : null}
      {showComposer ? <AssistantComposer /> : null}
      <AssistantControls />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { boxShadow: SHADOW },
  transcript: { flexShrink: 1 },
});
