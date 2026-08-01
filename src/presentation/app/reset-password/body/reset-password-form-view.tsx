import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AuthField } from '@presentation/app/login/model/auth-field';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, zIndices } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

interface ResetPasswordFormViewProps {
  newPassword: string;
  onChangeNew: (v: string) => void;
  confirmPassword: string;
  onChangeConfirm: (v: string) => void;
  showNew: boolean;
  onToggleNew: () => void;
  showConfirm: boolean;
  onToggleConfirm: () => void;
  focusField: AuthField | null;
  onFocus: (field: AuthField | null) => void;
  onBlur: () => void;
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
  showNew,
  onToggleNew,
  showConfirm,
  onToggleConfirm,
  focusField,
  onFocus,
  onBlur,
  confirmRef,
  loading,
  error,
  onSubmit,
  onBack,
}: ResetPasswordFormViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <>
      <View style={[styles.inputWrapper, { marginTop: spacing.xs }]}>
        <Ionicons
          name="lock-closed-outline"
          size={iconSizes.xl}
          color={colors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: focusField === AuthField.NewPassword ? colors.inputBorderFocused : colors.inputBorder,
            },
          ]}
          placeholder={t().resetPassword.newPasswordPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={newPassword}
          onChangeText={onChangeNew}
          secureTextEntry={!showNew}
          returnKeyType="next"
          onFocus={() => onFocus('new')}
          onBlur={onBlur}
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <Pressable
          onPress={onToggleNew}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={showNew ? t().resetPassword.hidePassword : t().resetPassword.showPassword}
        >
          <Ionicons
            name={showNew ? 'eye-off-outline' : 'eye-outline'}
            size={iconSizes.xl}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      <View style={[styles.inputWrapper, { marginTop: spacing.md }]}>
        <Ionicons
          name="lock-closed-outline"
          size={iconSizes.xl}
          color={colors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          ref={confirmRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor:
                focusField === AuthField.ConfirmPassword ? colors.inputBorderFocused : colors.inputBorder,
            },
          ]}
          placeholder={t().resetPassword.confirmPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={confirmPassword}
          onChangeText={onChangeConfirm}
          secureTextEntry={!showConfirm}
          returnKeyType="done"
          onFocus={() => onFocus('confirm')}
          onBlur={onBlur}
          onSubmitEditing={onSubmit}
        />
        <Pressable
          onPress={onToggleConfirm}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={showConfirm ? t().resetPassword.hidePassword : t().resetPassword.showPassword}
        >
          <Ionicons
            name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
            size={iconSizes.xl}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

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
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: zIndices.raised,
  },
  input: {
    minHeight: controlSizes.input,
    borderWidth: borderWidths.thin,
    borderRadius: radii.lg,
    paddingLeft: spacing.xxxl,
    paddingRight: spacing.xxxl + spacing.lg,
    fontSize: fontSizes.body,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: zIndices.raised,
    padding: spacing.xs,
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
