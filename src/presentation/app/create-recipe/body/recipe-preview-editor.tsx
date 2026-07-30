import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, mediaSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { RecipeSpecCard } from '@presentation/app/create-recipe/body/recipe-spec-card';
import { EditableItemsSection } from '@presentation/app/create-recipe/body/editable-items-section';
import { IngredientRow } from '@presentation/app/create-recipe/items/ingredient-row';
import { IngredientGroupRow } from '@presentation/app/create-recipe/items/ingredient-group-row';
import { isIngredientGroup } from '@domain/recipes/ingredients/is-ingredient-group';
import { StepRow } from '@presentation/app/create-recipe/items/step-row';
import { SelectTile } from '@presentation/app/create-recipe/items/select-tile';
import { TaxonomyPickerSheet } from '@presentation/app/create-recipe/sheets/taxonomy-picker-sheet';
import { TAXONOMY_PLACEHOLDER_EMOJI } from '@presentation/base/taxonomy/taxonomy-placeholder';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { FieldErrorText } from '@presentation/app/create-recipe/items/field-error-text';
import { NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import { ValueConstants } from '@core/constants';
import { MediaType } from '@domain/recipes/media/media-type';

export interface RecipePreviewEditorProps {
  recipe: EditableRecipe;
  /** Per-field backend validation messages, keyed by input — highlights the offending fields. */
  fieldErrors?: CreateRecipeFieldErrors['fields'];
  onChangeName: (value: string) => void;
  onChangeCuisine: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeServings: (value: number) => void;
  onChangeDifficulty: (value: Difficulty) => void;
  onChangePrep: (value: number) => void;
  onChangeCook: (value: number) => void;
  onChangeIngredient: (index: number, value: string) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: () => void;
  onAddIngredientGroup: () => void;
  onChangeStep: (index: number, value: string) => void;
  onRemoveStep: (index: number) => void;
  onAddStep: () => void;
  onOpenPhotos: () => void;
}

/** Inline live editor of every recipe field shown in the preview phase. */
export const RecipePreviewEditor = ({
  recipe,
  fieldErrors = NO_CREATE_RECIPE_FIELD_ERRORS.fields,
  onChangeName,
  onChangeCuisine,
  onChangeCategory,
  onChangeServings,
  onChangeDifficulty,
  onChangePrep,
  onChangeCook,
  onChangeIngredient,
  onRemoveIngredient,
  onAddIngredient,
  onAddIngredientGroup,
  onChangeStep,
  onRemoveStep,
  onAddStep,
  onOpenPhotos,
}: RecipePreviewEditorProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel, categoryLabel } = useTaxonomyLabel();
  const [picker, setPicker] = useState<'cuisine' | 'category' | null>(null);
  const cuisine = recipe.cuisine !== null ? cuisineLabel(recipe.cuisine) : null;
  const category = categoryLabel(recipe.category);
  const cover = recipe.media.find((m) => m.type === MediaType.Image);
  // Group headings are structure, not shopping: three groups do not mean three
  // more things to buy, and the count sits next to the word "Ingredients".
  const ingredientCount = recipe.ingredients.filter(
    (s) => s.trim().length > ValueConstants.zero && !isIngredientGroup(s),
  ).length;
  const stepCount = recipe.instructions.filter((s) => s.trim().length > ValueConstants.zero).length;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <View style={[styles.cover, { backgroundColor: colors.skeleton }]}>
        <RecipeImage uri={cover?.url} style={styles.coverImage} placeholderLabel={t().recipes.noPhoto} />
        <Pressable
          onPress={onOpenPhotos}
          style={[styles.photoBtn, { backgroundColor: colors.overlay }]}
          accessibilityRole="button"
          accessibilityLabel={cover !== undefined ? t().createRecipe.changePhoto : t().createRecipe.addPhoto}
        >
          <Ionicons name="camera" size={iconSizes.md} color={colors.onOverlay} />
          <ThemedText variant="caption" style={[styles.photoLabel, { color: colors.onOverlay }]}>
            {cover !== undefined ? t().createRecipe.changePhoto : t().createRecipe.addPhoto}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View>
          <TextInput
            value={recipe.name}
            onChangeText={onChangeName}
            placeholder={t().createRecipe.namePlaceholder}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.nameInput,
              { color: colors.text },
              fieldErrors.name !== undefined
                ? { borderWidth: borderWidths.thin, borderColor: colors.danger, borderRadius: radii.md, padding: spacing.sm }
                : null,
            ]}
          />
          {fieldErrors.name !== undefined ? <FieldErrorText message={fieldErrors.name} /> : null}
          <View style={styles.taxonomyRow}>
            <SelectTile
              label={t().createRecipe.cuisineLabel}
              emoji={cuisine?.emoji ?? TAXONOMY_PLACEHOLDER_EMOJI}
              value={cuisine?.name ?? null}
              placeholder={t().createRecipe.selectCuisine}
              onPress={() => setPicker('cuisine')}
              error={fieldErrors.cuisine}
            />
            <SelectTile
              label={t().createRecipe.categoryLabel}
              emoji={category.emoji}
              value={category.name}
              placeholder={t().createRecipe.selectCategory}
              onPress={() => setPicker('category')}
              error={fieldErrors.category}
            />
          </View>
        </View>

        <RecipeSpecCard
          recipe={recipe}
          fieldErrors={fieldErrors}
          onChangeServings={onChangeServings}
          onChangeDifficulty={onChangeDifficulty}
          onChangePrep={onChangePrep}
          onChangeCook={onChangeCook}
        />

        <EditableItemsSection
          icon="restaurant-outline"
          title={t().recipes.ingredients}
          count={ingredientCount}
          error={fieldErrors.ingredients}
          listGap={spacing.xxs}
          onAdd={onAddIngredient}
          addLabel={t().createRecipe.addIngredient}
          secondaryAction={{
            label: t().createRecipe.addGroup,
            icon: 'pricetag-outline',
            onPress: onAddIngredientGroup,
          }}
        >
          {recipe.ingredients.map((value, i) =>
            isIngredientGroup(value) ? (
              <IngredientGroupRow
                key={`ing-${i}`}
                value={value}
                onChange={(v) => onChangeIngredient(i, v)}
                onRemove={() => onRemoveIngredient(i)}
                removeLabel={t().mediaPicker.remove}
              />
            ) : (
              <IngredientRow
                key={`ing-${i}`}
                value={value}
                onChange={(v) => onChangeIngredient(i, v)}
                onRemove={() => onRemoveIngredient(i)}
                removeLabel={t().mediaPicker.remove}
              />
            ),
          )}
        </EditableItemsSection>

        <EditableItemsSection
          icon="flame"
          title={t().recipes.instructions}
          count={stepCount}
          error={fieldErrors.instructions}
          listGap={spacing.sm}
          onAdd={onAddStep}
          addLabel={t().createRecipe.addStep}
        >
          {recipe.instructions.map((value, i) => (
            <StepRow
              key={`step-${i}`}
              index={i}
              value={value}
              onChange={(v) => onChangeStep(i, v)}
              onRemove={() => onRemoveStep(i)}
              removeLabel={t().mediaPicker.remove}
            />
          ))}
        </EditableItemsSection>
      </View>

      <TaxonomyPickerSheet
        visible={picker === 'cuisine'}
        kind="cuisine"
        selected={recipe.cuisine}
        onSelect={onChangeCuisine}
        onClose={() => setPicker(null)}
      />
      <TaxonomyPickerSheet
        visible={picker === 'category'}
        kind="category"
        selected={recipe.category}
        onSelect={onChangeCategory}
        onClose={() => setPicker(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.lg,
  },
  cover: {
    height: mediaSizes.heroImageHeight,
    maxHeight: mediaSizes.coverMaxHeight,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoBtn: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    height: controlSizes.iconBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  photoLabel: {
    fontWeight: fontWeights.semibold,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  nameInput: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
    padding: ValueConstants.zero,
  },
  taxonomyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
