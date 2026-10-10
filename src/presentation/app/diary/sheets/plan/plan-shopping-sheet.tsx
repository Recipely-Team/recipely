import { StyleSheet, View } from 'react-native';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import type { PlanShoppingLine } from '@domain/meal-plan/shopping/plan-shopping-line';
import { GroceryAisle } from '@domain/meal-plan/shopping/grocery-aisle';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PlanShoppingRow } from '@presentation/app/diary/items/plan/plan-shopping-row';
import { usePlanShopping } from '@presentation/app/diary/hooks/plan/use-plan-shopping';
import { formatWeekRange } from '@presentation/base/utils/meal-plan/format-week-range';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { fontSizes, fontWeights, mealPlanSizes, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanShoppingSheetProps {
  visible: boolean;
  week: MealPlanWeek;
  onClose: () => void;
}

const NO_LINES: readonly PlanShoppingLine[] = [];

/**
 * "Add week to shopping list" (design spec → Meal planner, Shopping confirm):
 * the week's ingredients merged and grouped by aisle, staples unticked,
 * Select all / Clear all, and "Add N items" (disabled at 0). A centred dialog
 * (max 560) on an expanded viewport.
 */
export const PlanShoppingSheet = ({ visible, week, onClose }: PlanShoppingSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const shop = usePlanShopping(visible, week.start, onClose);
  const lines = shop.lines ?? NO_LINES;
  const count = lines.filter((line) => shop.selected.has(line.key)).length;
  const allSelected = lines.length > ValueConstants.zero && count === lines.length;

  return (
    <BottomSheet
      visible={visible}
      title={strings.shopTitle}
      onClose={onClose}
      dialogMaxWidth={mealPlanSizes.shopDialogMaxWidth}
      rightAction={lines.length === ValueConstants.zero ? undefined : { label: allSelected ? strings.clearAll : strings.selectAll, onPress: allSelected ? shop.clearAll : shop.selectAll }}
      footer={
        shop.lines === null || lines.length === ValueConstants.zero ? undefined : (
          <PrimaryButton label={strings.addItems.replace('{n}', String(count))} onPress={() => void shop.submit()} loading={shop.isSubmitting} disabled={count === ValueConstants.zero} />
        )
      }
    >
      <View style={styles.stack}>
        <SizedText size={fontSizes.caption} color={colors.textMuted}>
          {strings.shopSub
            .replace('{range}', formatWeekRange(week.start, locale))
            .replace('{m}', String(week.mealCount))
            .replace('{i}', String(lines.length))}
        </SizedText>
        {shop.failure !== null ? (
          <View style={styles.stack}>
            <FormBanner message={failureContent(shop.failure).body} severity={SeverityType.Danger} />
            <PrimaryButton label={strings.tryAgain} onPress={shop.retry} />
          </View>
        ) : shop.lines === null ? (
          <View accessible accessibilityState={{ busy: true }} style={styles.stack}>
            {Array.from({ length: mealPlanSizes.skeletonSlots }, (_, index) => (
              <SkeletonLoader key={index} width="100%" height={mealPlanSizes.shopRowMin} borderRadius={radii.md} />
            ))}
          </View>
        ) : lines.length === ValueConstants.zero ? (
          <SizedText size={fontSizes.medium} color={colors.textMuted}>
            {strings.shopEmpty}
          </SizedText>
        ) : (
          Object.values(GroceryAisle).map((aisle) => {
            const group = lines.filter((line) => line.aisle === aisle);
            if (group.length === ValueConstants.zero) return null;
            return (
              <View key={aisle}>
                <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.textMuted} style={styles.aisle} accessibilityRole="header">
                  {`${strings.aisles[aisle]} · ${group.length}`}
                </SizedText>
                {group.map((line) => (
                  <PlanShoppingRow key={line.key} line={line} checked={shop.selected.has(line.key)} onToggle={() => shop.toggle(line.key)} />
                ))}
              </View>
            );
          })
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  aisle: { textTransform: 'uppercase', marginBottom: spacing.xxs },
});
