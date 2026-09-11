import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { TranscriptEntryKind } from '@live-assistant/core';
import type { TranscriptEntry } from '@live-assistant/core';
import { useTranscript } from '@live-assistant/react';
import { useWidgetTheme } from '../theme/widget-theme-context';
import { MessageBubble } from './message-bubble';
import type { MessageEntry } from './message-entry';
import { ToolChip } from './tool-chip';
import type { ToolEntry } from './tool-entry';

export interface AssistantTranscriptProps {
  /** Replaces a said line. `fallback` is the default bubble, to wrap or ignore. */
  readonly renderMessage?: (entry: MessageEntry, fallback: ReactNode) => ReactNode;
  /** Replaces a tool run. Return null to hide it. `fallback` is the default chip. */
  readonly renderTool?: (entry: ToolEntry, fallback: ReactNode) => ReactNode;
}

const keyOf = (entry: TranscriptEntry): string => entry.id;

/**
 * The conversation, newest at the bottom, following it as it grows.
 *
 * Keyed by entry id, so a message growing a fragment at a time re-renders
 * that one row. Every row goes through the slots, which is how an app puts its
 * own bubbles, avatars or action chips in without forking the widget.
 */
export function AssistantTranscript({ renderMessage, renderTool }: AssistantTranscriptProps) {
  const theme = useWidgetTheme();
  const entries = useTranscript();
  const list = useRef<FlatList<TranscriptEntry>>(null);

  const renderItem = useCallback(
    ({ item }: { item: TranscriptEntry }): React.ReactElement | null => {
      if (item.kind === TranscriptEntryKind.Message) {
        const fallback = <MessageBubble entry={item} />;
        return <>{renderMessage ? renderMessage(item, fallback) : fallback}</>;
      }
      const fallback = <ToolChip entry={item} />;
      return <>{renderTool ? renderTool(item, fallback) : fallback}</>;
    },
    [renderMessage, renderTool],
  );

  return (
    <FlatList
      ref={list}
      data={entries as TranscriptEntry[]}
      keyExtractor={keyOf}
      renderItem={renderItem}
      contentContainerStyle={[styles.content, { padding: theme.spacing }]}
      onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
    />
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'flex-end' },
});
