import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAssistant } from '@live-assistant/react';
import { useWidgetStrings } from '../strings/widget-strings-context';
import { useWidgetTheme } from '../theme/widget-theme-context';

/** Mute and End, the two things a user must always be able to reach mid-session. */
export function AssistantControls() {
  const theme = useWidgetTheme();
  const strings = useWidgetStrings();
  const { isMuted, toggleMute, stop } = useAssistant();
  const pill = { borderRadius: theme.radius, paddingHorizontal: theme.spacing, paddingVertical: theme.spacing / 2 };

  return (
    <View style={[styles.row, { gap: theme.spacing }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isMuted ? strings.unmute : strings.mute}
        accessibilityState={{ selected: isMuted }}
        onPress={toggleMute}
        style={[pill, { backgroundColor: theme.colors.assistantBubble }]}
      >
        <Text style={{ color: theme.colors.text, fontSize: theme.fontSize }}>{isMuted ? strings.unmute : strings.mute}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.stop}
        onPress={() => void stop()}
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
