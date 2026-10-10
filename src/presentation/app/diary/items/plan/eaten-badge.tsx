import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, iconSizes, mealPlanSizes, radii } from '@presentation/base/theme';

/**
 * The check on an eaten meal's thumb (design spec → Meal planner, Eaten):
 * 22 pt `success` disc with an `onSuccess` check, ringed in the card colour,
 * at the thumb's bottom-right corner. Decorative — the "Eaten" tag says it.
 */
export const EatenBadge = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.success, borderColor: colors.cardBackground }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="checkmark" size={iconSizes.xs} color={colors.onSuccess} />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -borderWidths.medium,
    bottom: -borderWidths.medium,
    width: mealPlanSizes.eatenBadge,
    height: mealPlanSizes.eatenBadge,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
