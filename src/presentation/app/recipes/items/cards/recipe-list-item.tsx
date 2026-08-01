import { useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export interface RecipeListItemProps {
  recipe: RecipeSummaryEntity;
  onPress: () => void;
  /** Web-only: enable the hover lift on the underlying `RecipeCard`. */
  hoverEffect?: boolean;
}

/**
 * Wraps `RecipeCard` with reactive per-recipe like state from `likesStore`.
 * Seeding happens on mount so the store is populated before the card renders.
 */
export const RecipeListItem = ({ recipe, onPress, hoverEffect }: RecipeListItemProps): React.JSX.Element => {
  const { likesStore, authStore } = useStores();
  const { cuisineLabel } = useTaxonomyLabel();
  const authState = authStore((s) => s.state);
  const isAuthenticated = authState.status === StoreStatus.Authenticated;

  const likeState = likesStore((s) => s.byRecipe[recipe.id]);
  const seed = likesStore((s) => s.seed);
  const toggle = likesStore((s) => s.toggle);

  useEffect(() => {
    seed(recipe.id, recipe.likeCount, recipe.likedByMe);
  }, [recipe.id, recipe.likeCount, recipe.likedByMe, seed]);

  return (
    <RecipeCard
      name={recipe.name}
      image={recipe.image}
      cuisine={cuisineLabel(recipe.cuisine).name}
      difficulty={recipe.difficulty}
      rating={recipe.rating}
      likeCount={likeState?.likeCount ?? recipe.likeCount}
      likedByMe={likeState?.likedByMe ?? recipe.likedByMe}
      onPress={onPress}
      onLike={isAuthenticated ? () => void toggle(recipe.id) : undefined}
      hoverEffect={hoverEffect}
    />
  );
};
