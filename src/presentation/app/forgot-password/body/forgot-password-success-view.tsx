import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights, iconSizes, decorSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

interface ForgotPasswordSuccessViewProps {
  email: string;
  onBack: () => void;
  onTryDifferent: () => void;
}

export const ForgotPasswordSuccessView = ({ email, onBack, onTryDifferent }: ForgotPasswordSuccessViewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <>
      <View style={[styles.successCircle, { backgroundColor: colors.successLight }]}>
        <Ionicons name="checkmark-circle" size={iconSizes.huge} color={colors.success} />
      </View>

      <ThemedText variant="subtitle" style={styles.cardTitle}>
        {t().forgotPassword.sentTitle}
      </ThemedText>

      <ThemedText variant="body" muted style={styles.cardSubtitle}>
        {t().forgotPassword.sentBody}{' '}
        <ThemedText variant="body" style={{ fontWeight: fontWeights.bold }}>
          {email}
        </ThemedText>
      </ThemedText>

      <View style={styles.buttonRow}>
        <PrimaryButton
          label={t().forgotPassword.backToLogin}
          onPress={onBack}
        />
      </View>

      <Pressable
        onPress={onTryDifferent}
        style={styles.textLink}
        accessibilityRole="button"
        accessibilityLabel={t().forgotPassword.tryDifferent}
      >
        <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: fontWeights.semibold }}>
          {t().forgotPassword.tryDifferent}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  buttonRow: {
    marginTop: spacing.lg,
  },
  textLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  successCircle: {
    width: decorSizes.statusCircle,
    height: decorSizes.statusCircle,
    borderRadius: decorSizes.statusCircle / ValueConstants.two,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});
