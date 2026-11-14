import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, borderWidths } from '@presentation/base/theme';
import { PaywallMetrics } from '@presentation/app/premium/model/paywall-metrics';
import { ValueConstants } from '@core/constants';

export interface PlanCardProps {
  name: string;
  price: string;
  isSelected: boolean;
  bestValueLabel: string | null;
  accessibilityLabel: string;
  isDisabled: boolean;
  onPress: () => void;
}

/** One premium plan: its name, the store's price (a skeleton until the store answers), and a radio that shows the choice. */
export const PlanCard = ({ name, price, isSelected, bestValueLabel, accessibilityLabel, isDisabled, onPress }: PlanCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        isSelected
          ? { backgroundColor: colors.primaryLight, borderColor: colors.primary }
          : { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      {bestValueLabel === null ? null : (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText variant="caption" style={[styles.badgeText, { color: colors.primaryText }]}>
            {bestValueLabel}
          </ThemedText>
        </View>
      )}
      <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : undefined }]}>
        {isSelected ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primaryText} /> : null}
      </View>
      <ThemedText variant="body" style={styles.name}>
        {name}
      </ThemedText>
      {price.length === ValueConstants.zero ? (
        <View style={[styles.skeleton, { backgroundColor: colors.skeleton }]} />
      ) : (
        <ThemedText variant="subtitle" style={styles.price}>
          {price}
        </ThemedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: PaywallMetrics.planCardMinHeight,
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: borderWidths.medium,
    gap: spacing.xs,
  },
  badge: { position: 'absolute', top: -spacing.md, left: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radii.round },
  badgeText: { fontWeight: fontWeights.bold },
  radio: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: PaywallMetrics.planRadio,
    height: PaywallMetrics.planRadio,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: fontWeights.bold },
  price: { fontWeight: fontWeights.bold },
  skeleton: { width: PaywallMetrics.priceSkeletonWidth, height: PaywallMetrics.priceSkeletonHeight, borderRadius: radii.xs },
});
