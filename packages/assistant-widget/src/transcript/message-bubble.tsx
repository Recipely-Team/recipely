import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Speaker } from '@live-assistant/core';
import { useWidgetTheme } from '../theme/widget-theme-context';
import type { MessageEntry } from './message-entry';

export interface MessageBubbleProps {
  readonly entry: MessageEntry;
}

const GROWING_OPACITY = 0.75;
const FULL = 1;
const BUBBLE_SHARE = '82%';

/**
 * The default look of a said line: the user's on the right, the assistant's on the left.
 *
 * Memoised on the entry (which keeps its identity until it changes), so a
 * growing message re-renders only its own bubble; announced to screen readers
 * once final, never fragment by fragment.
 */
export const MessageBubble = memo(function MessageBubble({ entry }: MessageBubbleProps) {
  const theme = useWidgetTheme();
  const isUser = entry.speaker === Speaker.User;

  return (
    <View
      accessibilityLiveRegion={entry.isFinal ? 'polite' : 'none'}
      style={[
        styles.bubble,
        {
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          backgroundColor: isUser ? theme.colors.userBubble : theme.colors.assistantBubble,
          borderRadius: theme.radius,
          paddingHorizontal: theme.spacing,
          paddingVertical: theme.spacing / 2,
          marginVertical: theme.spacing / 4,
          opacity: entry.isFinal ? FULL : GROWING_OPACITY,
        },
      ]}
    >
      <Text style={{ color: isUser ? theme.colors.userText : theme.colors.assistantText, fontSize: theme.fontSize }}>
        {entry.text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  bubble: { maxWidth: BUBBLE_SHARE },
});
