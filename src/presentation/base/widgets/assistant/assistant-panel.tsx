import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssistantTranscript } from '@presentation/base/widgets/assistant/assistant-transcript';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantNotice } from '@presentation/base/widgets/assistant/assistant-notice';
import { assistantStatusLabel } from '@presentation/base/widgets/assistant/assistant-status-label';
import { useAssistantSession } from '@presentation/base/hooks/assistant/use-assistant-session';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, iconSizes, layoutSizes, radii, spacing } from '@presentation/base/theme';
import { CharConstants, ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

/**
 * The assistant's conversation surface.
 *
 * @remarks
 * - **It never covers the screen.** The whole point of this assistant is that
 *   it drives the app where the user can watch — a full-screen sheet would hide
 *   the create screen filling in, which is the thing being demonstrated. So it
 *   is a short panel docked above the pill, capped in height.
 * - **Typing is always available, including when voice is off.** Running out of
 *   the daily allowance is a routine outcome, so the text field is the way
 *   through rather than a consolation: the panel says which limit was reached
 *   and leaves the input exactly where it was.
 */
export const AssistantPanel = (): React.JSX.Element => {
  const { colors } = useTheme();
  const { status, transcript, deniedReason, error, clearError, closePanel, sendText } = useAssistantSession();
  const [draft, setDraft] = useState(CharConstants.empty);

  const submit = (): void => {
    if (draft.trim() === CharConstants.empty) return;
    clearError();
    sendText(draft.trim());
    setDraft(CharConstants.empty);
  };

  // A failed request outranks the status line: the user just asked for
  // something and it did not land, and the panel is the only place that can
  // say so — a request answered by nothing looks exactly like being ignored.
  const notice =
    error !== null ? t().assistant.requestFailed : assistantNotice(status, deniedReason);

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <ThemedText variant="subtitle">{t().assistant.title}</ThemedText>
        <ThemedText variant="caption" muted>
          {assistantStatusLabel(status)}
        </ThemedText>
        <Pressable
          onPress={() => {
            clearError();
            closePanel();
          }}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.close}
          style={styles.close}
        >
          <Ionicons name="close" size={iconSizes.sm} color={colors.textMuted} />
        </Pressable>
      </View>

      {notice !== null ? (
        <ThemedText variant="caption" muted style={styles.notice}>
          {notice}
        </ThemedText>
      ) : null}

      <View style={styles.transcript}>
        <AssistantTranscript lines={transcript} />
      </View>

      <View style={[styles.composer, { borderTopColor: colors.border }]}>
        <AutoGrowTextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t().assistant.placeholder}
          minHeight={controlSizes.inputSm}
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.send}
          style={styles.send}
        >
          <Ionicons name="arrow-up" size={iconSizes.sm} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
    maxWidth: layoutSizes.dialogMaxWidth,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  close: { marginLeft: 'auto' },
  notice: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  // A cap, not a height: the panel must not grow over the screen it is driving.
  transcript: { maxHeight: layoutSizes.assistantTranscriptMaxHeight, paddingHorizontal: spacing.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: borderWidths.hairline,
  },
  input: { flex: ValueConstants.one },
  send: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
});
