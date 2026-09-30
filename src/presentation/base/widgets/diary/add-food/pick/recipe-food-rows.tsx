import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { FoodPickRow } from '@presentation/base/widgets/diary/add-food/pick/food-pick-row';
import type { RecipeFoodLoader } from '@presentation/base/widgets/diary/add-food/search/recipe-food-loader';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { t, useLocale } from '@presentation/i18n';

export interface RecipeFoodRowsProps {
  recipes: readonly RecipeSummaryEntity[];
  loader: RecipeFoodLoader;
  onChoose: (food: LoggableFood) => void;
}

/**
 * Recipe rows of the pick step, kcal from the list itself. Tapping one still
 * fetches the full recipe, whose macros the logged entry snapshots.
 */
export const RecipeFoodRows = ({ recipes, loader, onChoose }: RecipeFoodRowsProps): React.JSX.Element => {
  const locale = useLocale();
  const choose = async (recipeId: string): Promise<void> => {
    const food = await loader.open(recipeId);
    if (food !== null) onChoose(food);
  };
  return (
    <>
      {recipes.map((recipe) => {
        return (
          <FoodPickRow
            key={recipe.id}
            name={recipe.name}
            meta={t().diary.perServingMeta.replace('{k}', formatWholeNumber(recipe.caloriesPerServing, locale))}
            imageUrl={recipe.image}
            isQuickAdd={false}
            isLoading={loader.loadingId === recipe.id}
            onPress={() => void choose(recipe.id)}
          />
        );
      })}
    </>
  );
};
