import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';

export interface CreatorRecipeCellProps {
  recipe: RecipeSummaryEntity;
  onOpen: (id: string) => void;
}

/** One of the creator's recipes in their grid: the app's recipe card, cuisine named in the viewer's language. */
const CreatorRecipeCellComponent = ({ recipe, onOpen }: CreatorRecipeCellProps): React.JSX.Element => {
  const { cuisineLabel } = useTaxonomyLabel();
  return (
    <View style={styles.cell}>
      <RecipeCard
        name={recipe.name}
        image={recipe.image}
        imageFocus={recipe.imageFocus}
        cuisine={cuisineLabel(recipe.cuisine).name}
        difficulty={recipe.difficulty}
        rating={recipe.rating}
        provenance={recipe.provenanceMarks}
        photoCount={recipe.photoCount}
        onPress={() => onOpen(recipe.id)}
      />
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
