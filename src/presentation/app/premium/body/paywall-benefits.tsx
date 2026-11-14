import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes } from '@presentation/base/theme';
import { PaywallMetrics } from '@presentation/app/premium/model/paywall-metrics';

export interface PaywallBenefitsProps {
  benefits: readonly string[];
}

/** What premium gives, one checked line each. Only promises the product keeps are listed. */
export const PaywallBenefits = ({ benefits }: PaywallBenefitsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.list} accessibilityRole="list">
      {benefits.map((benefit) => (
        <View key={benefit} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primary} />
          </View>
          <ThemedText variant="body" style={styles.text}>
            {benefit}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: {
    width: PaywallMetrics.benefitDot,
    height: PaywallMetrics.benefitDot,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, fontWeight: fontWeights.medium },
});
