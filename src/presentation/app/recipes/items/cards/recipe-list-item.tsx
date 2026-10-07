import { memo, useCallback, useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export interface RecipeListItemProps {
  recipe: RecipeSummaryEntity;
  /**
   * Opens a recipe by id. Taken unbound and bound here, so a caller passes one
   * stable handler for every row instead of a fresh closure per row per render.
   */
  onOpen: (id: string) => void;
  /** Web-only: enable the hover lift on the underlying `RecipeCard`. */
  hoverEffect?: boolean;
}

/**
 * Wraps `RecipeCard` with reactive per-recipe like state from `likesStore`.
 * Seeding happens on mount so the store is populated before the card renders.
 *
 * @remarks
 * **Memoised, and the callers keep their props stable to match.** The feed's
 * parent re-renders on scroll, on every filter change and on every store
 * update, and each of those re-rendered EVERY visible row — each row re-reading
 * the likes store and re-resolving its taxonomy labels. `memo` is only half of
 * it: a row whose `onPress` is a fresh arrow on every render is not memoised at
 * all, so the row takes the unbound `onOpen(id)` and binds it (and `onLike`)
 * with `useCallback` itself — a curried `openRecipe(id)` at the call site used
 * to hand every row a new `onPress` on every render.
 */
const RecipeListItemComponent = ({ recipe, onOpen, hoverEffect }: RecipeListItemProps): React.JSX.Element => {
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

  const onPress = useCallback(() => onOpen(recipe.id), [onOpen, recipe.id]);
  const onLike = useCallback(() => void toggle(recipe.id), [toggle, recipe.id]);

  return (
    <RecipeCard
      name={recipe.name}
      image={recipe.image}
      imageFocus={recipe.imageFocus}
      cuisine={cuisineLabel(recipe.cuisine).name}
      difficulty={recipe.difficulty}
      rating={recipe.rating}
      provenance={recipe.provenanceMarks}
      photoCount={recipe.photoCount}
      likeCount={likeState?.likeCount ?? recipe.likeCount}
      likedByMe={likeState?.likedByMe ?? recipe.likedByMe}
      onPress={onPress}
      onLike={isAuthenticated ? onLike : undefined}
      hoverEffect={hoverEffect}
    />
  );
};

export const RecipeListItem = memo(RecipeListItemComponent);
