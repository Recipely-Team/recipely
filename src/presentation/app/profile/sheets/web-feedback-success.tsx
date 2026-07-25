import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Success panel shown after a feedback message is sent (shared between web modal and could mirror the sheet). */
export const WebFeedbackSuccess = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconChip, { backgroundColor: colors.successLight }]}>
        <Ionicons name="checkmark-circle" size={iconSizes.xxxl} color={colors.success} />
      </View>
      <ThemedText variant="subtitle" style={styles.center}>
        {t().support.sentTitle}
      </ThemedText>
      <ThemedText variant="body" muted style={styles.center}>
        {t().support.sentSub}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
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
