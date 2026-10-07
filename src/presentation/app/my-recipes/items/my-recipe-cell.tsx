import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { WebRecipeListItem } from '@presentation/base/widgets/cards/web-recipe-list-item';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';

export interface MyRecipeCellProps {
  recipe: RecipeSummaryEntity;
  gridColumns: number;
  isExpanded: boolean;
  saved: boolean;
  /** The Created tab: the viewer's own recipe, so the card shows its status and photo edit. */
  ownedByMe: boolean;
  onOpen: (id: string) => void;
  onToggleSave: (id: string) => void;
}

/**
 * One recipe in a My-Recipes tab: the web card on wide layouts, the phone card
 * otherwise, in a grid cell when there is more than one column.
 *
 * @remarks
 * **Memoised, with id handlers.** It was an inline `renderItem` closure; the
 * list now passes the screen's stable handlers, so a re-render of the screen
 * re-renders no card.
 */
const MyRecipeCellComponent = ({
  recipe,
  gridColumns,
  isExpanded,
  saved,
  ownedByMe,
  onOpen,
  onToggleSave,
}: MyRecipeCellProps): React.JSX.Element => (
  <View style={gridColumns > ValueConstants.one ? styles.gridCell : null}>
    {isExpanded ? (
      <WebRecipeListItem recipe={recipe} saved={saved} onOpen={onOpen} onToggleSave={onToggleSave} ownedByMe={ownedByMe} />
    ) : (
      <RecipeCard
        name={recipe.name}
        image={recipe.image}
        imageFocus={recipe.imageFocus}
        cuisine={recipe.cuisine}
        difficulty={recipe.difficulty}
        rating={recipe.rating}
        photoCount={recipe.photoCount}
        onPress={() => onOpen(recipe.id)}
        {...(ownedByMe ? { ownerStatus: recipe.ownerStatus, onEditPhotos: () => onOpen(recipe.id) } : {})}
      />
    )}
  </View>
);

export const MyRecipeCell = memo(MyRecipeCellComponent);

const styles = StyleSheet.create({
  gridCell: {
    flex: ValueConstants.one,
  },
});
