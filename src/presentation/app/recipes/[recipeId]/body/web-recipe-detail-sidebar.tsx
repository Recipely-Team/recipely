import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { PortionStepper } from '@presentation/app/recipes/[recipeId]/items/meta/portion-stepper';
import { UnitSystemToggle } from '@presentation/app/recipes/[recipeId]/items/steps/unit-system-toggle';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { TickBox } from '@presentation/base/widgets/inputs/tick-box';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, lineHeights, iconSizes, layoutSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { ValueConstants } from '@core/constants';
import { NutritionPanel } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-panel';
import { AddToDiaryButton } from '@presentation/app/recipes/[recipeId]/items/diary/add-to-diary-button';
import { AddToShoppingButton } from '@presentation/app/recipes/[recipeId]/items/shopping/add-to-shopping-button';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';

export interface WebRecipeDetailSidebarProps {
  recipe: RecipeEntity;
  checkedIngredients: boolean[];
  portions: PortionScaling;
  onToggleIngredient: (index: number) => void;
  /** The backend is still computing nutrition; the empty state says so. */
  isNutritionCalculating: boolean;
}

/**
 * Sticky-column sidebar for the web recipe detail: ingredients checklist (with
 * the unit toggle), a meta grid whose servings row is the portion stepper, and
 * the nutrition panel.
 */
export const WebRecipeDetailSidebar = ({
  recipe,
  checkedIngredients,
  portions,
  onToggleIngredient,
  isNutritionCalculating,
}: WebRecipeDetailSidebarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t();
  const checkedCount = checkedIngredients.filter(Boolean).length;
  const ingredients = IngredientList.of(portions.ingredients);

  const headingLineHeight = useTextLineHeight(fontSizes.body, lineHeights.snug);

  const metaRows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; control?: React.JSX.Element }[] = [
    { icon: 'timer-outline' as const, label: strings.recipes.prepTime, value: `${String(recipe.prepTimeMinutes)} ${strings.createRecipe.minShort}` },
    { icon: 'flame-outline' as const, label: strings.recipes.cookTime, value: `${String(recipe.cookTimeMinutes)} ${strings.createRecipe.minShort}` },
    { icon: 'speedometer-outline' as const, label: strings.recipes.difficulty, value: difficultyLabel(recipe.difficulty) },
    { icon: 'people-outline' as const, label: strings.recipes.servings, value: String(portions.servings), control: <PortionStepper portions={portions} /> },
  ];

  return (
    <View style={styles.stack}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <ThemedText variant="subtitle">{strings.recipes.ingredients}</ThemedText>
          <ThemedText variant="caption" muted>
            {`${String(checkedCount)}/${String(ingredients.filledCount)}`}
          </ThemedText>
        </View>
        <View style={styles.checklist}>
          <UnitSystemToggle portions={portions} />
          {ingredients.lines.map((line, i) => {
            const item = line.raw;
            // Group headings get no checkbox.
            if (line.isGroup) {
              return (
                <ThemedText
                  key={i}
                  variant="caption"
                  accessibilityRole="header"
                  style={[styles.groupHeading, { color: colors.primary }]}
                >
                  {line.groupLabel}
                </ThemedText>
              );
            }
            const checked = checkedIngredients[i] ?? false;
            return (
              <Pressable
                key={i}
                onPress={() => onToggleIngredient(i)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={item}
                style={styles.checkRow}
              >
                <TickBox checked={checked} />
                <ThemedText
                  variant="body"
                  style={[
                    styles.checkText,
                    {
                      color: checked ? colors.textMuted : colors.text,
                      textDecorationLine: checked ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {item}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <AddToShoppingButton source={{ recipeId: recipe.id, recipeName: recipe.name, lines: portions.ingredients }} inCard />
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        {metaRows.map((meta, i) => (
          <View
            key={meta.label}
            style={[
              styles.metaRow,
              i > ValueConstants.zero ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : null,
            ]}
          >
            <View style={styles.metaLabel}>
              <Ionicons name={meta.icon} size={iconSizes.xl} color={colors.primary} />
              <ThemedText variant="body" muted>
                {meta.label}
              </ThemedText>
            </View>
            {meta.control ?? (
              <ThemedText variant="body" style={styles.metaValue}>
                {meta.value}
              </ThemedText>
            )}
          </View>
        ))}
      </View>

      {/* Always rendered, matching the mobile card: a recipe with no figures
          says so rather than dropping the section, which read as a bug. */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <ThemedText
          accessibilityRole="header"
          style={[styles.nutritionHeading, { lineHeight: headingLineHeight, color: colors.text }]}
        >
          {strings.recipes.nutrition}
        </ThemedText>
        <NutritionPanel
          facts={recipe.nutritionFacts}
          isCalculating={isNutritionCalculating}
          source={recipe.nutritionSource}
          compact
        />
        <AddToDiaryButton recipe={recipe} inCard />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: layoutSizes.webDetailStackGap,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  checklist: {
    gap: spacing.xs,
  },
  groupHeading: {
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkText: {
    flex: ValueConstants.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  metaLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaValue: {
    fontWeight: fontWeights.semibold,
  },
  nutritionHeading: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.heavy,
    marginBottom: spacing.md,
  },
});
