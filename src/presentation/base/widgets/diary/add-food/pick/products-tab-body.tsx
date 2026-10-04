import { useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import { CharConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { FoodPickList } from '@presentation/base/widgets/diary/add-food/pick/food-pick-list';
import { CategoryChips } from '@presentation/base/widgets/diary/add-food/pick/category-chips';
import { PickSkeleton } from '@presentation/base/widgets/diary/add-food/pick/pick-skeleton';
import { PickMessage } from '@presentation/base/widgets/diary/add-food/pick/pick-message';
import { pagedRows } from '@presentation/base/widgets/diary/add-food/list/paged-rows';
import { phaseOfLists } from '@presentation/base/widgets/diary/add-food/list/phase-of-lists';
import { PickPhase } from '@presentation/base/widgets/diary/add-food/list/pick-phase';
import { PickRowType } from '@presentation/base/widgets/diary/add-food/list/pick-row-type';
import { t } from '@presentation/i18n';

export interface ProductsTabBodyProps {
  onChooseProduct: (product: FoodProduct) => void;
}

const PRODUCTS = 'products';
const NO_CATEGORIES: readonly never[] = [];

/**
 * The Products tab (Add food v2 spec §4): the catalogue's shelves as chips,
 * then the selected shelf's foods and drinks — both paged on scroll. Branded
 * packs are not browsable; they come from the search.
 */
export const ProductsTabBody = ({ onChooseProduct }: ProductsTabBodyProps): React.JSX.Element => {
  const { foodCatalogStore } = useStores();
  const categories = foodCatalogStore((s) => s.categories);
  const category = foodCatalogStore((s) => s.category);
  const products = foodCatalogStore((s) => s.products);
  const strings = t().diary;

  useEffect(() => {
    void foodCatalogStore.getState().loadProducts();
  }, [foodCatalogStore]);

  const chips = (
    <CategoryChips
      categories={categories.status === StoreStatus.Loaded ? categories.items : NO_CATEGORIES}
      selected={category}
      onSelect={(key) => void foodCatalogStore.getState().selectCategory(key)}
      onEndReached={() => void foodCatalogStore.getState().loadMoreCategories()}
    />
  );
  const phase = phaseOfLists([products]);
  const retry = (): void => void foodCatalogStore.getState().selectCategory(category);

  if (phase.phase === PickPhase.Error) {
    return <PickMessage title={strings.loadFailed} hint={null} action={{ label: strings.tryAgain, icon: 'refresh', onPress: retry }} />;
  }
  const rows =
    phase.phase === PickPhase.Ready
      ? [
          { type: PickRowType.Heading, key: [PickRowType.Heading, PRODUCTS].join(CharConstants.colon), title: strings.groupFoodsDrinks },
          ...pagedRows(products, PRODUCTS, (product) => ({ type: PickRowType.Product, key: product.key, product })),
        ]
      : [];
  return (
    <FoodPickList
      rows={rows}
      header={
        <>
          {chips}
          {phase.phase === PickPhase.Loading ? <PickSkeleton /> : null}
          {phase.phase === PickPhase.Empty ? <PickMessage title={strings.productsEmpty} hint={null} action={null} /> : null}
        </>
      }
      onEndReached={() => void foodCatalogStore.getState().loadMoreProducts()}
      onPickProduct={onChooseProduct}
      onRetryMore={() => void foodCatalogStore.getState().loadMoreProducts()}
    />
  );
};
