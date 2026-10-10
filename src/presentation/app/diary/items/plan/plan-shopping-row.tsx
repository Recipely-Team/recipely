import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PlanShoppingLine } from '@domain/meal-plan/shopping/plan-shopping-line';
import { shoppingAmountText } from '@domain/shopping/items/shopping-amount-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, fontSizes, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface PlanShoppingRowProps {
  line: PlanShoppingLine;
  checked: boolean;
  onToggle: () => void;
}

/**
 * One merged ingredient in the shopping confirm (design spec → Meal planner,
 * Shopping confirm): a 24 pt checkbox, the name, its amounts joined with " + ",
 * a "Staple" tag, and the recipes it came from on one line.
 */
export const PlanShoppingRow = ({ line, checked, onToggle }: PlanShoppingRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().mealPlan;
  const decimalMark = t().recipes.portions.decimalMark;
  const amount = line.drafts
    .map((draft) => shoppingAmountText(draft.quantity, draft.unit, decimalMark))
    .filter((text) => text !== CharConstants.empty)
    .join(' + ');
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={[line.label, amount].filter((part) => part !== CharConstants.empty).join(', ')}
      style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <View
        style={[
          styles.box,
          checked ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border, backgroundColor: colors.cardBackground },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primaryText} /> : null}
      </View>
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <SizedText size={mealPlanSizes.plannedTitle} weight={fontWeights.semibold} style={styles.grow} numberOfLines={ValueConstants.two}>
            {line.label}
          </SizedText>
          {line.isStaple ? (
            <View style={[styles.tag, { backgroundColor: colors.chipBackground }]}>
              <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.chipText}>
                {strings.staple}
              </SizedText>
            </View>
          ) : null}
          {amount === CharConstants.empty ? null : (
            <SizedText size={fontSizes.caption} color={colors.textMuted}>
              {amount}
            </SizedText>
          )}
        </View>
        <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
          {line.sources.join(', ')}
        </SizedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: mealPlanSizes.shopRowMin, paddingVertical: spacing.xs2 },
  box: {
    width: iconSizes.xxl,
    height: iconSizes.xxl,
    borderRadius: mealPlanSizes.checkboxRadius,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: ValueConstants.one },
  tag: { paddingHorizontal: spacing.xs2, borderRadius: radii.round },
});
