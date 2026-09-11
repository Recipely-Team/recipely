import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAssistant } from '@live-assistant/react';
import { useWidgetStrings } from '../strings/widget-strings-context';
import { useWidgetTheme } from '../theme/widget-theme-context';

const EMPTY = '';

/** Typing to the live session — for a noisy room, or a question better spelled than said. */
export function AssistantComposer() {
  const theme = useWidgetTheme();
  const strings = useWidgetStrings();
  const { sendText } = useAssistant();
  const [text, setText] = useState(EMPTY);

  const send = (): void => {
    const trimmed = text.trim();
    if (trimmed === EMPTY) return;
    if (sendText(trimmed)) setText(EMPTY);
  };

  return (
    <View style={[styles.row, { gap: theme.spacing / 2 }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        placeholder={strings.composerPlaceholder}
        placeholderTextColor={theme.colors.mutedText}
        returnKeyType="send"
        accessibilityLabel={strings.composerPlaceholder}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: theme.fontSize,
            borderRadius: theme.radius,
            paddingHorizontal: theme.spacing,
            paddingVertical: theme.spacing / 2,
            backgroundColor: theme.colors.assistantBubble,
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.send}
        onPress={send}
        style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius, paddingHorizontal: theme.spacing, paddingVertical: theme.spacing / 2 }}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: theme.fontSize }}>{strings.send}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1 },
});
