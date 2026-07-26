import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, layoutSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { CharConstants, ValueConstants } from '@core/constants';

export interface WebRecipeDetailSidebarProps {
  recipe: RecipeEntity;
  checkedIngredients: boolean[];
  onToggleIngredient: (index: number) => void;
}

/** Sticky-column sidebar for the web recipe detail: ingredients checklist, a meta grid, and a nutrition tile grid. */
export const WebRecipeDetailSidebar = ({
  recipe,
  checkedIngredients,
  onToggleIngredient,
}: WebRecipeDetailSidebarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t();
  const checkedCount = checkedIngredients.filter(Boolean).length;

  const gram = (value: number | undefined): string =>
    value !== undefined && value > ValueConstants.zero ? `${String(value)}${strings.nutrition.g}` : CharConstants.emDash;

  const macros = [
    {
      label: strings.nutrition.calories,
      value: recipe.caloriesPerServing > ValueConstants.zero ? String(recipe.caloriesPerServing) : CharConstants.emDash,
    },
    { label: strings.nutrition.protein, value: gram(recipe.nutrition?.protein) },
    { label: strings.nutrition.carbs, value: gram(recipe.nutrition?.carbs) },
    { label: strings.nutrition.fat, value: gram(recipe.nutrition?.fat) },
  ];
  const hasNutrition =
    recipe.caloriesPerServing > ValueConstants.zero ||
    (recipe.nutrition?.protein ?? ValueConstants.zero) > ValueConstants.zero ||
    (recipe.nutrition?.carbs ?? ValueConstants.zero) > ValueConstants.zero ||
    (recipe.nutrition?.fat ?? ValueConstants.zero) > ValueConstants.zero;

  const metaRows = [
    { icon: 'timer-outline' as const, label: strings.recipes.prepTime, value: `${String(recipe.prepTimeMinutes)} ${strings.createRecipe.minShort}` },
    { icon: 'flame-outline' as const, label: strings.recipes.cookTime, value: `${String(recipe.cookTimeMinutes)} ${strings.createRecipe.minShort}` },
    { icon: 'speedometer-outline' as const, label: strings.recipes.difficulty, value: difficultyLabel(recipe.difficulty) },
    { icon: 'people-outline' as const, label: strings.recipes.servings, value: String(recipe.servings) },
  ];

  return (
    <View style={styles.stack}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <ThemedText variant="subtitle">{strings.recipes.ingredients}</ThemedText>
          <ThemedText variant="caption" muted>
            {`${String(checkedCount)}/${String(recipe.ingredients.length)}`}
          </ThemedText>
        </View>
        <View style={styles.checklist}>
          {recipe.ingredients.map((item, i) => {
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
                <View
                  style={[
                    styles.checkbox,
                    checked
                      ? { backgroundColor: colors.success, borderColor: colors.success }
                      : { backgroundColor: 'transparent', borderColor: colors.border },
                  ]}
                >
                  {checked ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.onSuccess} /> : null}
                </View>
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
            <ThemedText variant="body" style={styles.metaValue}>
              {meta.value}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Always rendered, matching the mobile card: a recipe with no figures
          says so rather than dropping the section, which read as a bug. */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <ThemedText variant="subtitle">{strings.recipes.nutrition}</ThemedText>
        </View>
        {hasNutrition ? (
          <View style={styles.tileGrid}>
            {macros.map((macro) => (
              <View key={macro.label} style={[styles.tile, { backgroundColor: colors.surface }]}>
                <ThemedText style={[styles.tileValue, { color: colors.text }]}>{macro.value}</ThemedText>
                <ThemedText style={[styles.tileLabel, { color: colors.textMuted }]}>{macro.label}</ThemedText>
              </View>
            ))}
          </View>
        ) : (
          <ThemedText variant="caption" muted>
            {strings.nutrition.unavailable}
          </ThemedText>
        )}
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: controlSizes.checkbox,
    height: controlSizes.checkbox,
    borderRadius: radii.sm,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
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
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: ValueConstants.one,
    flexBasis: '45%',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xxs,
  },
  tileValue: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
  tileLabel: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
});
