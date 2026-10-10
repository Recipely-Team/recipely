import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { AuthAutofill } from '@presentation/base/widgets/inputs/auth-autofill';
import { AuthTextField } from '@presentation/base/widgets/inputs/auth-text-field';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

interface ResetPasswordFormViewProps {
  newPassword: string;
  onChangeNew: (v: string) => void;
  confirmPassword: string;
  onChangeConfirm: (v: string) => void;
  confirmRef: React.RefObject<TextInput | null>;
  loading: boolean;
  error: string | undefined;
  onSubmit: () => void;
  onBack: () => void;
}

export const ResetPasswordFormView = ({
  newPassword,
  onChangeNew,
  confirmPassword,
  onChangeConfirm,
  confirmRef,
  loading,
  error,
  onSubmit,
  onBack,
}: ResetPasswordFormViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <>
      <AuthTextField
        iconName="lock-closed-outline"
        autofill={AuthAutofill.NewPassword}
        placeholder={t().resetPassword.newPasswordPlaceholder}
        value={newPassword}
        onChangeText={onChangeNew}
        password
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        containerStyle={styles.firstField}
      />

      <AuthTextField
        ref={confirmRef}
        iconName="lock-closed-outline"
        autofill={AuthAutofill.NewPassword}
        placeholder={t().resetPassword.confirmPlaceholder}
        value={confirmPassword}
        onChangeText={onChangeConfirm}
        password
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        containerStyle={styles.nextField}
      />

      {error !== undefined ? (
        <View style={styles.bannerRow}>
          <FormBanner message={error} />
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <PrimaryButton
          label={loading ? t().resetPassword.submitting : t().resetPassword.submit}
          onPress={onSubmit}
          loading={loading}
          disabled={newPassword.length === ValueConstants.zero || confirmPassword.length === ValueConstants.zero || loading}
        />
      </View>

      <Pressable
        onPress={onBack}
        style={styles.textLink}
        accessibilityRole="button"
        accessibilityLabel={t().resetPassword.backToLogin}
      >
        <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: fontWeights.semibold }}>
          {t().resetPassword.backToLogin}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  firstField: {
    marginTop: spacing.xs,
  },
  nextField: {
    marginTop: spacing.md,
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
