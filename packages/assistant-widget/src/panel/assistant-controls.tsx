import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AssistantState } from '@live-assistant/core';
import { useAssistantController, useAssistantState } from '@live-assistant/react';
import { useWidgetStrings } from '../strings/widget-strings-context';
import { useWidgetTheme } from '../theme/widget-theme-context';

const selectMuted = (state: AssistantState) => state.isMuted;

/** Mute and End, the two things a user must always be able to reach mid-session. */
export function AssistantControls() {
  const theme = useWidgetTheme();
  const strings = useWidgetStrings();
  const controller = useAssistantController();
  const isMuted = useAssistantState(selectMuted);
  const pill = { borderRadius: theme.radius, paddingHorizontal: theme.spacing, paddingVertical: theme.spacing / 2 };

  return (
    <View style={[styles.row, { gap: theme.spacing }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isMuted ? strings.unmute : strings.mute}
        accessibilityState={{ selected: isMuted }}
        onPress={() => controller.toggleMute()}
        style={[pill, { backgroundColor: theme.colors.assistantBubble }]}
      >
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize }}>{isMuted ? strings.unmute : strings.mute}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.stop}
        onPress={() => void controller.stop()}
        style={[pill, { backgroundColor: theme.colors.danger }]}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: theme.fontSize }}>{strings.stop}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
});
