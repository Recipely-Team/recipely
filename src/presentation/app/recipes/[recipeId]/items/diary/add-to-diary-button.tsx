import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AddFoodSheet } from '@presentation/base/widgets/diary/add-food/add-food-sheet';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { useAddToDiary } from '@presentation/app/recipes/[recipeId]/hooks/use-add-to-diary';
import { t } from '@presentation/i18n';

export interface AddToDiaryButtonProps {
  recipe: RecipeEntity;
  /** Web: inside the Nutrition card, `primary` and 44pt. Mobile: under the card, chip-coloured and 48pt. */
  inCard: boolean;
}

/**
 * "Add to diary" under (or, on the web, inside) the Nutrition card, drawn only
 * when the recipe has calories (design spec → Food Diary §1). It carries its
 * own Add food sheet and sign-in prompt, so the page wires nothing.
 */
export const AddToDiaryButton = ({ recipe, inCard }: AddToDiaryButtonProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const diary = useAddToDiary(recipe);
  if (diary.food === null) return null;
  const fill = inCard ? colors.primary : colors.chipBackground;
  const ink = inCard ? colors.primaryText : colors.chipText;
  return (
    <>
      <Pressable
        onPress={diary.open}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          inCard ? styles.web : styles.mobile,
          { backgroundColor: fill, opacity: pressed ? opacities.pressedSubtle : opacities.full },
        ]}
      >
        <Ionicons name="calendar-outline" size={iconSizes.lg} color={ink} />
        <SizedText size={inCard ? fontSizes.medium : fontSizes.body} weight={fontWeights.bold} color={ink}>
          {t().diary.addToDiary}
        </SizedText>
      </Pressable>
      <AddFoodSheet request={diary.request} onClose={diary.close} onOpenDiary={diary.openDiary} />
      <SignInPromptSheet
        visible={diary.promptVisible}
        onClose={diary.closePrompt}
        onSignIn={diary.goToSignIn}
        message={diary.promptMessage}
      />
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
    paddingHorizontal: spacing.lg,
  },
  mobile: { minHeight: controlSizes.buttonSm, marginTop: spacing.md },
  web: { minHeight: controlSizes.touchTarget, marginTop: spacing.lg },
});
