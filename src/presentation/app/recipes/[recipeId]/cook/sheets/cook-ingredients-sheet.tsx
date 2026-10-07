import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, spacing } from '@presentation/base/theme';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { ValueConstants } from '@core/constants';
import { IngredientGroupHeading } from '@presentation/app/recipes/[recipeId]/items/steps/ingredient-group-heading';
import { AddToShoppingButton } from '@presentation/app/recipes/[recipeId]/items/shopping/add-to-shopping-button';
import { t } from '@presentation/i18n';

export interface CookIngredientsSheetProps {
  visible: boolean;
  recipeId: string;
  recipeName: string;
  /** The recipe page's lines, at the servings and units chosen there. */
  ingredients: readonly string[];
  onClose: () => void;
}

/**
 * The ingredient list, a glance away from the step: a bottom sheet on a phone,
 * a centred dialog on the web shell (both `BottomSheet`).
 *
 * The recipe page's lines — scaled and converted as chosen there, group
 * headings drawn as headings; ticking ingredients off stays on the recipe page;
 * "Add to shopping list" puts these same lines on the list.
 */
export const CookIngredientsSheet = ({ visible, recipeId, recipeName, ingredients, onClose }: CookIngredientsSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const lines = IngredientList.of(ingredients).lines;

  return (
    <BottomSheet
      visible={visible}
      title={t().cookMode.ingredients}
      onClose={onClose}
      showCloseButton
      footer={<AddToShoppingButton source={{ recipeId, recipeName, lines: ingredients }} inCard={false} />}
    >
      {lines.map((line, i) =>
        line.isGroup ? (
          <IngredientGroupHeading key={`${String(i)}:${line.raw}`} label={line.groupLabel} isFirst={i === ValueConstants.zero} />
        ) : (
          <View
            // Lines repeat ("salt"); position disambiguates in a list that never reorders.
            key={`${String(i)}:${line.raw}`}
            style={[styles.row, { borderBottomColor: colors.cardBorder }]}
          >
            <ThemedText variant="body" style={{ color: colors.text }}>
              {line.raw}
            </ThemedText>
          </View>
        ),
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidths.hairline,
  },
});
