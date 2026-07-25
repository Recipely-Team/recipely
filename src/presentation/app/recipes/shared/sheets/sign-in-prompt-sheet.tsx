import { StyleSheet } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing, fontSizes, lineHeightFor } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface SignInPromptSheetProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  /** Per-action copy, e.g. "Sign in to like this recipe." Falls back to a generic prompt. */
  message?: string;
}

/**
 * "Sign in to continue" CTA shown when a guest attempts a gated interaction
 * (like, save, comment). Built on the generic {@link BottomSheet} — cancel is
 * handled by the sheet's own grabber (tap/drag) and backdrop tap, so this
 * only adds the message and a primary "Sign In" action.
 */
export const SignInPromptSheet = ({
  visible,
  onClose,
  onSignIn,
  message,
}: SignInPromptSheetProps): React.JSX.Element => {
  return (
    <BottomSheet visible={visible} title={t().signInPrompt.title} onClose={onClose}>
      <ThemedText variant="body" muted style={styles.message}>
        {message ?? t().signInPrompt.message}
      </ThemedText>
      <PrimaryButton label={t().signInPrompt.cta} onPress={onSignIn} />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  message: {
    marginBottom: spacing.lg,
    lineHeight: lineHeightFor(fontSizes.body),
  },
});
