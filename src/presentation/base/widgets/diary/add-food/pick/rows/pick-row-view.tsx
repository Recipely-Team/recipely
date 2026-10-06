import { CharConstants, ValueConstants } from '@core/constants';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import { FoodPickRow } from '@presentation/base/widgets/diary/add-food/pick/rows/food-pick-row';
import { PickListHeading } from '@presentation/base/widgets/diary/add-food/pick/rows/pick-list-heading';
import { LoadMoreRow } from '@presentation/base/widgets/diary/add-food/pick/rows/load-more-row';
import type { PickRowEntryType } from '@presentation/base/widgets/diary/add-food/list/pick-row';
import { PickRowType } from '@presentation/base/widgets/diary/add-food/list/pick-row-type';
import { FoodThumbIcon } from '@presentation/base/widgets/diary/food-thumb-icon';
import { productThumbIcon } from '@presentation/base/widgets/diary/product-thumb-icon';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatPerHundred } from '@presentation/base/utils/diary/units/format-per-hundred';
import { formatFoodPortion } from '@presentation/base/utils/diary/units/format-food-portion';
import { t, useLocale } from '@presentation/i18n';

export interface PickRowViewProps {
  row: PickRowEntryType;
  onPickRecipe?: (hit: RecipeFoodHit) => void;
  onPickProduct?: (product: FoodProduct) => void;
  onPickRecent?: (recent: RecentFoodType) => void;
  onRetryMore: (listKey: string) => void;
}

const join = (parts: readonly (string | null)[]): string => parts.filter((part) => part !== null).join(CharConstants.middotSpaced);

/** "3 variants · 38 kcal / 100 ml" for a curated row; "Ülker · 36 g · 530 kcal / 100 g" for a branded pack. */
const productMeta = (product: FoodProduct, locale: string): string => {
  const strings = t().diary;
  const per100 = formatPerHundred(product.per100, product.unit, locale);
  if (product.isBranded) return join([product.brand, product.packSize, per100]);
  const variants =
    product.variantCount > ValueConstants.one ? strings.variantsOther.replace('{n}', formatWholeNumber(product.variantCount, locale)) : null;
  return join([variants, per100]);
};

/** One row of the pick step's list, drawn by its type. */
export const PickRowView = ({ row, onPickRecipe, onPickProduct, onPickRecent, onRetryMore }: PickRowViewProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  const perServing = (kcal: number): string => strings.perServingMeta.replace('{k}', formatWholeNumber(kcal, locale));
  switch (row.type) {
    case PickRowType.Heading:
      return <PickListHeading title={row.title} />;
    case PickRowType.More:
      return <LoadMoreRow failed={row.failed} onRetry={() => onRetryMore(row.listKey)} />;
    case PickRowType.Recipe:
      return (
        <FoodPickRow
          name={row.hit.name}
          tag={row.hit.isDraft ? strings.draftTag : null}
          meta={perServing(row.hit.perServing.calories)}
          sourceNote={null}
          imageUrl={row.hit.imageUrl}
          icon={null}
          onPress={() => onPickRecipe?.(row.hit)}
        />
      );
    case PickRowType.Product:
      return (
        <FoodPickRow
          name={row.product.displayName}
          tag={null}
          meta={productMeta(row.product, locale)}
          sourceNote={row.product.isBranded ? strings.sourceOff : null}
          imageUrl={row.product.imageUrl}
          icon={productThumbIcon(row.product.kind, row.product.isBranded)}
          onPress={() => onPickProduct?.(row.product)}
        />
      );
    case PickRowType.Recent: {
      const recent = row.recent;
      if (recent.kind === RecentFoodKind.Food) {
        return (
          <FoodPickRow
            name={recent.food.name}
            tag={null}
            meta={perServing(recent.food.perServing.calories)}
            sourceNote={null}
            imageUrl={recent.food.imageUrl}
            icon={recent.food.isQuickAdd ? FoodThumbIcon.QuickAdd : null}
            onPress={() => onPickRecent?.(recent)}
          />
        );
      }
      const kcal = recent.product.nutrientsFor(recent.quantity).calories;
      return (
        <FoodPickRow
          name={recent.product.name}
          tag={null}
          meta={join([formatFoodPortion(recent.quantity.unit, recent.quantity.value, recent.product.baseUnit, locale), `${formatWholeNumber(kcal, locale)} ${t().nutrition.kcal}`])}
          sourceNote={null}
          imageUrl={null}
          icon={productThumbIcon(recent.product.kind, recent.product.isBranded)}
          onPress={() => onPickRecent?.(recent)}
        />
      );
    }
  }
};
