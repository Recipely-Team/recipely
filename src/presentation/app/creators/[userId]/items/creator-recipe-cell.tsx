import { memo } from "react";
import { useStore } from 'zustand';
import { StyleSheet, View } from "react-native";
import type { RecipeSummaryEntity } from "@domain/recipes/recipe-summary-entity";
import { ValueConstants } from "@core/constants";
import { useStores } from "@presentation/bootstrap/use-stores";
import { WebRecipeCard } from "@presentation/base/widgets/cards/web-recipe-card";
import { CreatorRecipeTile } from "@presentation/app/creators/[userId]/items/creator-recipe-tile";

export interface CreatorRecipeCellProps {
  recipe: RecipeSummaryEntity;
  /** The expanded viewport draws the web recipe card; a phone the square tile. */
  expanded: boolean;
  onOpen: (id: string) => void;
  onToggleSave: (id: string) => void;
}

/** One of the creator's recipes in their grid: the phone tile, or the web card with its save toggle. */
const CreatorRecipeCellComponent = ({
  recipe,
  expanded,
  onOpen,
  onToggleSave,
}: CreatorRecipeCellProps): React.JSX.Element => {
  // Its own recipe only, so saving one card does not re-render the grid.
  const saved = useStore(useStores().savedRecipesStore, (s) => s.savedIds.has(recipe.id));
  return (
    <View style={styles.cell}>
      {expanded ? (
        <WebRecipeCard
          recipe={recipe}
          saved={saved}
          onOpen={onOpen}
          onToggleSave={onToggleSave}
        />
      ) : (
        <CreatorRecipeTile recipe={recipe} onOpen={onOpen} />
      )}
    </View>
  );
};

export const CreatorRecipeCell = memo(CreatorRecipeCellComponent);

const styles = StyleSheet.create({
  cell: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
});
