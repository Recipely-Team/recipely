import { Pressable, StyleSheet, View } from 'react-native';
import { AuthAutofill } from '@presentation/base/widgets/inputs/auth-autofill';
import { AuthTextField } from '@presentation/base/widgets/inputs/auth-text-field';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

interface ForgotPasswordInputViewProps {
  email: string;
  onChangeEmail: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onBack: () => void;
  error: string | undefined;
}

export const ForgotPasswordInputView = ({
  email, onChangeEmail, loading, onSend, onBack, error,
}: ForgotPasswordInputViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <>
      <AuthTextField
        iconName="mail-outline"
        autofill={AuthAutofill.Email}
        placeholder={t().forgotPassword.emailPlaceholder}
        value={email}
        onChangeText={onChangeEmail}
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={onSend}
        containerStyle={styles.fieldSpacing}
      />

      <ThemedText variant="caption" muted style={styles.hint}>
        {t().forgotPassword.hint}
      </ThemedText>

      {error !== undefined ? (
        <View style={styles.bannerRow}>
          <FormBanner message={error} />
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <PrimaryButton
          label={loading ? t().forgotPassword.sending : t().forgotPassword.send}
          onPress={onSend}
          loading={loading}
          disabled={email.trim().length === ValueConstants.zero}
        />
      </View>

      <Pressable
        onPress={onBack}
        style={styles.textLink}
        accessibilityRole="button"
        accessibilityLabel={t().forgotPassword.backToLogin}
      >
        <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: fontWeights.semibold }}>
          {t().forgotPassword.backToLogin}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  fieldSpacing: {
    marginTop: spacing.xs,
  },
  hint: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    fontSize: fontSizes.small,
  },
  bannerRow: {
    marginTop: spacing.md,
  },
  buttonRow: {
    marginTop: spacing.lg,
  },
  textLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
});
