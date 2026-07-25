import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface FeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Mobile bottom sheet for the Help & Feedback form. Shows a form on open and a success state after submission. */
export const FeedbackSheet = ({ visible, onClose }: FeedbackSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { feedbackStore } = useStores();
  const submit = feedbackStore((s) => s.submit);
  const isSubmitting = feedbackStore((s) => s.isSubmitting);
  const error = feedbackStore((s) => s.error);
  const reset = feedbackStore((s) => s.reset);

  const [subject, setSubject] = useState(CharConstants.empty);
  const [message, setMessage] = useState(CharConstants.empty);
  const [sent, setSent] = useState(false);

  // UI deliberately requires `subject` too, even though the domain treats it as
  // optional — keep both guards in sync if this is ever loosened.
  const canSend = subject.trim().length > ValueConstants.zero && message.trim().length > ValueConstants.zero;

  const handleSend = async (): Promise<void> => {
    const ok = await submit({ subject, message });
    if (ok) setSent(true);
  };

  const handleClose = (): void => {
    reset();
    setSubject(CharConstants.empty);
    setMessage(CharConstants.empty);
    setSent(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} title={t().support.sheetTitle} onClose={handleClose}>
      {sent ? (
        <View style={styles.successWrap}>
          <View style={[styles.iconChip, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={iconSizes.xxxl} color={colors.success} />
          </View>
          <ThemedText variant="subtitle" style={styles.center}>
            {t().support.sentTitle}
          </ThemedText>
          <ThemedText variant="body" muted style={styles.center}>
            {t().support.sentSub}
          </ThemedText>
          <Pressable
            onPress={handleClose}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t().support.sentDone}
          >
            <ThemedText variant="subtitle" style={{ color: colors.primaryText }}>
              {t().support.sentDone}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <ThemedText variant="body" muted>{t().support.subtitle}</ThemedText>
          <View style={styles.field}>
            <ThemedText variant="caption" muted style={styles.fieldLabel}>
              {t().support.subject.toUpperCase()}
            </ThemedText>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder={t().support.subjectPlaceholder}
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.background, borderColor: colors.cardBorder },
              ]}
            />
          </View>
          <View style={styles.field}>
            <ThemedText variant="caption" muted style={styles.fieldLabel}>
              {t().support.message.toUpperCase()}
            </ThemedText>
            <AutoGrowTextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t().support.messagePlaceholder}
              placeholderTextColor={colors.textMuted}
              minHeight={controlSizes.messageField}
              style={[
                styles.input,
                styles.textArea,
                { color: colors.text, backgroundColor: colors.background, borderColor: colors.cardBorder },
              ]}
            />
          </View>
          {error !== null ? (
            <ThemedText variant="caption" style={[styles.errorText, { color: colors.danger }]}>
              {t().support.error}
            </ThemedText>
          ) : null}
          <Pressable
            onPress={() => void handleSend()}
            disabled={!canSend || isSubmitting}
            style={[
              styles.actionBtn,
              { backgroundColor: canSend && !isSubmitting ? colors.primary : colors.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t().support.send}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <ThemedText variant="subtitle" style={{ color: colors.primaryText }}>
                {t().support.send}
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  input: {
    minHeight: controlSizes.inputSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.body,
  },
  textArea: {
    paddingTop: spacing.md,
  },
  errorText: {
    fontWeight: fontWeights.semibold,
  },
  actionBtn: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controlSizes.button,
  },
  successWrap: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconChip: {
    width: iconSizes.xxxl * ValueConstants.two,
    height: iconSizes.xxxl * ValueConstants.two,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
