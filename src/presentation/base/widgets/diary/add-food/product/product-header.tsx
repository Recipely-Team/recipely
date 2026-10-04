import { StyleSheet, View } from 'react-native';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { LoggableProduct } from '@domain/diary/foods/loggable-product';
import { CharConstants, ValueConstants } from '@core/constants';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { productThumbIcon } from '@presentation/base/widgets/diary/product-thumb-icon';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatPerHundred } from '@presentation/base/utils/diary/units/format-per-hundred';
import { formatDayMonth } from '@presentation/base/utils/diary/format-day-month';
import { controlSizes, diarySizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface ProductHeaderProps {
  product: LoggableProduct;
  date: CalendarDate;
  /** Hidden in edit mode and when the sheet opened on this step. */
  canGoBack: boolean;
  onBack: () => void;
}

/** The product step's header: back, tile, name, the brand line of a pack, and "38 kcal / 100 ml · 30 September · Today". */
export const ProductHeader = ({ product, date, canGoBack, onBack }: ProductHeaderProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  const brandLine = [product.brand, product.packSize].filter((part) => part !== null).join(CharConstants.middotSpaced);
  const meta = [
    product.baseUnit === null ? null : formatPerHundred(product.per100, product.baseUnit, locale),
    formatDayMonth(date, locale),
    date.equals(CalendarDate.today()) ? strings.today : null,
  ]
    .filter((part) => part !== null)
    .join(CharConstants.middotSpaced);
  return (
    <View style={styles.header}>
      {canGoBack ? <RoundIconButton icon="chevron-back" accessibilityLabel={t().common.back} onPress={onBack} size={controlSizes.iconBtn} /> : null}
      <FoodThumb imageUrl={product.imageUrl} icon={productThumbIcon(product.kind, product.isBranded)} size={diarySizes.foodThumbLarge} />
      <View style={styles.text}>
        <SizedText size={fontSizes.heading} weight={fontWeights.bold} numberOfLines={ValueConstants.two}>
          {product.name}
        </SizedText>
        {product.isBranded && brandLine.length > ValueConstants.zero ? (
          <SizedText size={fontSizes.small} weight={fontWeights.semibold}>
            {brandLine}
          </SizedText>
        ) : null}
        <SizedText size={fontSizes.small} muted>
          {meta}
        </SizedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
});
