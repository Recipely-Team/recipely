import { memo, useEffect } from 'react';
import { WebRecipeCard, type WebRecipeCardProps } from '@presentation/base/widgets/cards/web-recipe-card';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Wraps {@link WebRecipeCard} with reactive per-recipe like state, the way
 * `RecipeListItem` does for the phone card.
 *
 * @remarks
 * The web card read `recipe.likedByMe` straight off the payload — whatever the
 * list fetch happened to say, frozen from then on. Nothing seeded the likes
 * store either, so a like made anywhere else could not show here AND the
 * assistant, which asks that store, found no entry to act on. Three reports of
 * "beğendim dedi ama beğenmedi" met at this line.
 *
 * Seeding on mount is what `RecipeListItem` does and for the same reason: the
 * store is the one place both the card and the assistant agree to read.
 */
const WebRecipeListItemComponent = (props: WebRecipeCardProps): React.JSX.Element => {
  const { likesStore } = useStores();
  const { recipe } = props;
  const likeState = likesStore((state) => state.byRecipe[recipe.id]);
  const seed = likesStore((state) => state.seed);

  useEffect(() => {
    seed(recipe.id, recipe.likeCount, recipe.likedByMe);
  }, [recipe.id, recipe.likeCount, recipe.likedByMe, seed]);

  return (
    <WebRecipeCard
      {...props}
      likedByMe={likeState?.likedByMe ?? recipe.likedByMe}
      likeCount={likeState?.likeCount ?? recipe.likeCount}
    />
  );
};

export const WebRecipeListItem = memo(WebRecipeListItemComponent);
