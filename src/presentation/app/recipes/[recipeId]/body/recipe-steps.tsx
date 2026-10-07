import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { IngredientCard } from '@presentation/app/recipes/[recipeId]/items/steps/ingredient-card';
import { IngredientGroupHeading } from '@presentation/app/recipes/[recipeId]/items/steps/ingredient-group-heading';
import { InstructionCard } from '@presentation/app/recipes/[recipeId]/items/steps/instruction-card';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { UnitSystemToggle } from '@presentation/app/recipes/[recipeId]/items/steps/unit-system-toggle';
import { AddToShoppingButton } from '@presentation/app/recipes/[recipeId]/items/shopping/add-to-shopping-button';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';

export interface RecipeStepsProps {
  recipe: RecipeEntity;
  recipeId: string;
  isOwner: boolean;
  isExpanded: boolean;
  checkedIngredients: boolean[];
  portions: PortionScaling;
  onToggleIngredient: (index: number) => void;
  completedSteps: readonly boolean[];
  onToggleStep: (index: number) => void;
  onDelete: () => void;
}

/**
 * Ingredients + instructions checklists for the mobile detail screen, plus the
 * owner-only edit/delete actions below them.
 */
export const RecipeSteps = ({
  recipe,
  recipeId,
  isOwner,
  isExpanded,
  checkedIngredients,
  portions,
  onToggleIngredient,
  completedSteps,
  onToggleStep,
  onDelete,
}: RecipeStepsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const ingredients = IngredientList.of(portions.ingredients);

  return (
    <>
      <SectionHeader title={t().recipes.ingredients} count={ingredients.filledCount} />
      <View style={styles.cardsList}>
        <UnitSystemToggle portions={portions} />
        {ingredients.lines.map((line, i) =>
          line.isGroup ? (
            <IngredientGroupHeading
              key={i}
              label={line.groupLabel}
              isFirst={i === ValueConstants.zero}
            />
          ) : (
            <IngredientCard
              key={i}
              raw={line.raw}
              checked={checkedIngredients[i] ?? false}
              onToggle={() => onToggleIngredient(i)}
            />
          ),
        )}
        <AddToShoppingButton source={{ recipeId, recipeName: recipe.name, lines: portions.ingredients }} />
      </View>

      <SectionHeader title={t().recipes.instructions} count={recipe.instructions.length} />
      <View style={styles.cardsList}>
        {recipe.instructions.map((step, i) => (
          <InstructionCard
            key={i}
            index={i}
            step={step}
            completed={completedSteps[i] ?? false}
            onToggle={() => onToggleStep(i)}
          />
        ))}
      </View>

      {isOwner ? (
        isExpanded ? (
          // Web: ghost danger pill.
          <View style={styles.ownerActionsWeb}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t().myRecipes.deleteRecipe}
              onPress={onDelete}
              style={({ pressed }) => [
                styles.ghostPill,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressed : opacities.full },
              ]}
            >
              <Ionicons name="trash-outline" size={iconSizes.md} color={colors.danger} />
              <ThemedText variant="caption" style={[styles.ownerBtnLabel, { color: colors.danger }]}>
                {t().myRecipes.deleteRecipe}
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          // Mobile: inline danger button; the hero overlay owns share/like/save.
          <View style={styles.ownerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t().myRecipes.deleteRecipe}
              onPress={onDelete}
              style={({ pressed }) => [
                styles.ownerBtn,
                { opacity: pressed ? opacities.pressed : opacities.full, backgroundColor: colors.dangerLight },
              ]}
            >
              <Ionicons name="trash-outline" size={iconSizes.md} color={colors.danger} />
              <ThemedText variant="caption" style={[styles.ownerBtnLabel, { color: colors.danger }]}>
                {t().myRecipes.deleteRecipe}
              </ThemedText>
            </Pressable>
          </View>
        )
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  cardsList: {
    gap: spacing.sm,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  ownerActionsWeb: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  ownerBtn: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.searchBar,
    borderRadius: radii.round,
  },
  ghostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  ownerBtnLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
});
