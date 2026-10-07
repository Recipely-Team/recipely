import { StyleSheet, View } from 'react-native';
import { SpecRow } from '@presentation/app/create-recipe/items/spec-row';
import { Stepper } from '@presentation/app/create-recipe/body/stepper';
import { DifficultyToggle } from '@presentation/app/create-recipe/items/difficulty-toggle';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { radii, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { Difficulty } from '@domain/recipes/difficulty';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import { ValueConstants } from '@core/constants';
import { RecipeLimits } from '@domain/recipes/recipe-limits';

const TIME_STEP = 5;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export interface RecipeSpecCardProps {
  recipe: EditableRecipe;
  fieldErrors: CreateRecipeFieldErrors['fields'];
  onChangeServings: (value: number) => void;
  onChangeDifficulty: (value: Difficulty) => void;
  onChangePrep: (value: number) => void;
  onChangeCook: (value: number) => void;
}

/** Servings / difficulty / prep / cook steppers card in the recipe editor. */
export const RecipeSpecCard = ({
  recipe,
  fieldErrors,
  onChangeServings,
  onChangeDifficulty,
  onChangePrep,
  onChangeCook,
}: RecipeSpecCardProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.specCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <SpecRow icon="people" label={t().createRecipe.servings} error={fieldErrors.servings}>
        <Stepper
          value={recipe.servings}
          decreaseLabel={t().createRecipe.servings}
          increaseLabel={t().createRecipe.servings}
          onDecrement={() => onChangeServings(clamp(recipe.servings - ValueConstants.one, RecipeLimits.servingsMin, RecipeLimits.servingsMax))}
          onIncrement={() => onChangeServings(clamp(recipe.servings + ValueConstants.one, RecipeLimits.servingsMin, RecipeLimits.servingsMax))}
        />
      </SpecRow>
      <SpecRow icon="speedometer" label={t().createRecipe.difficulty} error={fieldErrors.difficulty}>
        <DifficultyToggle
          value={recipe.difficulty}
          label={difficultyLabel}
          onChange={onChangeDifficulty}
        />
      </SpecRow>
      <SpecRow icon="time-outline" label={t().createRecipe.prep} error={fieldErrors.prepTimeMinutes}>
        <Stepper
          value={recipe.prepTimeMinutes}
          suffix={t().createRecipe.minShort}
          decreaseLabel={t().createRecipe.prep}
          increaseLabel={t().createRecipe.prep}
          onDecrement={() => onChangePrep(Math.max(ValueConstants.zero, recipe.prepTimeMinutes - TIME_STEP))}
          onIncrement={() => onChangePrep(recipe.prepTimeMinutes + TIME_STEP)}
        />
      </SpecRow>
      <SpecRow icon="flame" label={t().createRecipe.cook} error={fieldErrors.cookTimeMinutes} last>
        <Stepper
          value={recipe.cookTimeMinutes}
          suffix={t().createRecipe.minShort}
          decreaseLabel={t().createRecipe.cook}
          increaseLabel={t().createRecipe.cook}
          onDecrement={() => onChangeCook(Math.max(ValueConstants.zero, recipe.cookTimeMinutes - TIME_STEP))}
          onIncrement={() => onChangeCook(recipe.cookTimeMinutes + TIME_STEP)}
        />
      </SpecRow>
    </View>
  );
};

const styles = StyleSheet.create({
  specCard: {
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
});
