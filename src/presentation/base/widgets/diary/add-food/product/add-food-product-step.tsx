import { ScrollView, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';
import { ValueConstants } from '@core/constants';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { MealPicker } from '@presentation/base/widgets/diary/add-food/meal-picker';
import { NutrientTotalBox } from '@presentation/base/widgets/diary/add-food/detail/nutrient-total-box';
import { PickSkeleton } from '@presentation/base/widgets/diary/add-food/pick/pick-skeleton';
import { PickMessage } from '@presentation/base/widgets/diary/add-food/pick/pick-message';
import { ProductHeader } from '@presentation/base/widgets/diary/add-food/product/product-header';
import { VariantPicker } from '@presentation/base/widgets/diary/add-food/product/variant-picker';
import { UnitChips } from '@presentation/base/widgets/diary/add-food/product/unit-chips';
import { AmountStepper } from '@presentation/base/widgets/diary/add-food/product/amount-stepper';
import type { ProductStepModel } from '@presentation/base/widgets/diary/add-food/state/product/product-step-model';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';
import { formatFoodPortion } from '@presentation/base/utils/diary/units/format-food-portion';
import { unitWord } from '@presentation/base/utils/diary/units/unit-word';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface AddFoodProductStepProps {
  model: ProductStepModel;
  date: CalendarDate;
  meal: MealSlotType;
  canGoBack: boolean;
  onBack: () => void;
  onRetry: () => void;
  onVariantChange: (index: number) => void;
  onUnitChange: (unit: FoodUnit) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onMealChange: (meal: MealSlotType) => void;
}

/**
 * The product step (Add food v2 spec §2b): variant, the total for the chosen
 * amount, the amount in one of the product's units, the meal — and, for a
 * branded pack, where the figures come from.
 */
export const AddFoodProductStep = (props: AddFoodProductStepProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  const { model } = props;
  if (model.status === StoreStatus.Loading) return <PickSkeleton />;
  if (model.status === StoreStatus.Error) {
    return <PickMessage title={strings.loadFailed} hint={null} action={{ label: strings.tryAgain, icon: 'refresh', onPress: props.onRetry }} />;
  }
  const { product, quantity, variants } = model;
  const label = (text: string): React.JSX.Element => (
    <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
      {text}
    </SizedText>
  );
  return (
    <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
      <ProductHeader product={product} date={props.date} canGoBack={props.canGoBack} onBack={props.onBack} />
      {variants.length > ValueConstants.zero && product.baseUnit !== null ? (
        <View style={styles.section}>
          {label(strings.variant)}
          <VariantPicker variants={variants} selected={model.variantIndex} baseUnit={product.baseUnit} onSelect={props.onVariantChange} />
        </View>
      ) : null}
      <NutrientTotalBox nutrients={product.nutrientsFor(quantity)} />
      <View style={styles.section}>
        {label(strings.amount)}
        <UnitChips units={product.units} baseUnit={product.baseUnit} selected={quantity.unit.key} onSelect={props.onUnitChange} />
        <View style={styles.amountRow}>
          <SizedText size={fontSizes.caption} muted style={styles.equals}>
            {quantity.isBaseUnit || product.baseUnit === null
              ? null
              : strings.equals.replace('{v}', formatFoodPortion({ key: product.baseUnit, amount: ValueConstants.one }, quantity.baseAmount, product.baseUnit, locale))}
          </SizedText>
          <AmountStepper
            value={quantity.isBaseUnit ? formatFoodPortion(quantity.unit, quantity.value, product.baseUnit, locale) : formatOneDecimal(quantity.value, locale)}
            canDecrement={quantity.canDecrement}
            canIncrement={quantity.canIncrement}
            onIncrement={props.onIncrement}
            onDecrement={props.onDecrement}
          />
        </View>
      </View>
      <View style={styles.section}>
        {label(strings.meal)}
        <MealPicker value={props.meal} onChange={props.onMealChange} />
      </View>
      {product.isBranded && product.baseUnit !== null ? (
        <SizedText size={fontSizes.micro} muted>
          {strings.sourceNote.replace('{u}', unitWord(product.baseUnit, ValueConstants.zero))}
        </SizedText>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.lg, paddingBottom: spacing.sm },
  section: { gap: spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  equals: { flex: ValueConstants.one },
});
