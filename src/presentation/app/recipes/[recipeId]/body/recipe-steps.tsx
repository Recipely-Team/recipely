import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { IngredientCard } from '@presentation/app/recipes/[recipeId]/items/steps/ingredient-card';
import { InstructionCard } from '@presentation/app/recipes/[recipeId]/items/steps/instruction-card';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export interface RecipeStepsProps {
  recipe: RecipeEntity;
  recipeId: string;
  isOwner: boolean;
  isWebShell: boolean;
  checkedIngredients: boolean[];
  onToggleIngredient: (index: number) => void;
  completedSteps: boolean[];
  onToggleStep: (index: number) => void;
  onEdit: () => void;
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
  isWebShell,
  checkedIngredients,
  onToggleIngredient,
  completedSteps,
  onToggleStep,
  onEdit,
  onDelete,
}: RecipeStepsProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <>
      <SectionHeader title={`${t().recipes.ingredients} · ${recipe.ingredients.length}`} />
      <View style={styles.cardsList}>
        {recipe.ingredients.map((item, i) => (
          <IngredientCard
            key={i}
            raw={item}
            checked={checkedIngredients[i] ?? false}
            onToggle={() => onToggleIngredient(i)}
          />
        ))}
      </View>

      <SectionHeader title={`${t().recipes.instructions} · ${recipe.instructions.length}`} />
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
        isWebShell ? (
          // WEB: design's header-cluster button language — ghost
          // "Edit" pill + ghost "Delete" pill (danger-tinted).
          <View style={styles.ownerActionsWeb}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t().myRecipes.editRecipe}
              onPress={onEdit}
              style={({ pressed }) => [
                styles.ghostPill,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressed : opacities.full },
              ]}
            >
              <Ionicons name="create-outline" size={iconSizes.md} color={colors.text} />
              <ThemedText variant="caption" style={[styles.ownerBtnLabel, { color: colors.text }]}>
                {t().myRecipes.editRecipe}
              </ThemedText>
            </Pressable>
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
          // MOBILE: edit lives in the floating overlay cluster (a
          // pencil button, per the design); delete stays inline as
          // a single danger button.
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
