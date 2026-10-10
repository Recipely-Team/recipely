import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AddToPlanSheet } from '@presentation/base/widgets/meal-plan/add-to-plan-sheet';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { useAddToPlan } from '@presentation/app/recipes/[recipeId]/hooks/use-add-to-plan';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AddToPlanButtonProps {
  recipe: RecipeEntity;
  /** Web sidebar: 44 pt ghost under "Add to diary". Mobile: 48 pt ghost under it. */
  inCard: boolean;
}

/**
 * "Add to plan" on a recipe (design spec → Meal planner, Recipe detail). The
 * prototype puts it beside Save under the title; this app's Save is a floating
 * action, so it sits under "Add to diary" instead — the other "put this
 * recipe somewhere" action. Carries its own sheet and sign-in prompt.
 */
export const AddToPlanButton = ({ recipe, inCard }: AddToPlanButtonProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const plan = useAddToPlan(recipe);
  if (!plan.enabled) return null;
  return (
    <>
      <Pressable
        onPress={plan.open}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          inCard ? styles.web : styles.mobile,
          { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full },
        ]}
      >
        <Ionicons name="calendar-number-outline" size={iconSizes.lg} color={colors.text} />
        <SizedText size={inCard ? fontSizes.medium : fontSizes.body} weight={fontWeights.bold}>
          {t().mealPlan.addToPlan}
        </SizedText>
      </Pressable>
      <AddToPlanSheet request={plan.request} onClose={plan.close} onView={plan.openPlan} />
      <SignInPromptSheet visible={plan.promptVisible} onClose={plan.closePrompt} onSignIn={plan.goToSignIn} message={plan.promptMessage} />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.lg,
  },
  mobile: { minHeight: controlSizes.buttonSm, marginTop: spacing.sm },
  web: { minHeight: controlSizes.touchTarget, marginTop: spacing.sm },
});
