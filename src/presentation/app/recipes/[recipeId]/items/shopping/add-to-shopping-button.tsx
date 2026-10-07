import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { useAddToShoppingList } from '@presentation/app/recipes/[recipeId]/hooks/shopping/use-add-to-shopping-list';
import type { ShoppingSource } from '@presentation/app/recipes/[recipeId]/model/shopping/shopping-source';
import { t } from '@presentation/i18n';

export interface AddToShoppingButtonProps {
  source: ShoppingSource;
  /** Matches `AddToDiaryButton`: web, inside the Ingredients card, `primary` and 44pt; elsewhere chip-coloured and 48pt. */
  inCard: boolean;
}

/**
 * "Add to shopping list" under a recipe's ingredients — drawn only when there
 * is something to buy. It carries its own sign-in prompt, so the page wires
 * nothing but the lines it shows.
 */
export const AddToShoppingButton = ({ source, inCard }: AddToShoppingButtonProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const shopping = useAddToShoppingList(source);
  if (!shopping.canAdd) return null;
  const fill = inCard ? colors.primary : colors.chipBackground;
  const ink = inCard ? colors.primaryText : colors.chipText;
  return (
    <>
      <Pressable
        onPress={shopping.add}
        disabled={shopping.isAdding}
        accessibilityRole="button"
        accessibilityState={{ busy: shopping.isAdding }}
        style={({ pressed }) => [
          styles.button,
          inCard ? styles.web : styles.mobile,
          { backgroundColor: fill, opacity: pressed ? opacities.pressedSubtle : opacities.full },
        ]}
      >
        {shopping.isAdding ? (
          <ActivityIndicator color={ink} />
        ) : (
          <Ionicons name="cart-outline" size={iconSizes.lg} color={ink} />
        )}
        <SizedText size={inCard ? fontSizes.medium : fontSizes.body} weight={fontWeights.bold} color={ink}>
          {t().shopping.addIngredients}
        </SizedText>
      </Pressable>
      <SignInPromptSheet
        visible={shopping.promptVisible}
        onClose={shopping.closePrompt}
        onSignIn={shopping.goToSignIn}
        message={shopping.promptMessage}
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
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  mobile: { minHeight: controlSizes.buttonSm, marginTop: spacing.md },
  web: { minHeight: controlSizes.touchTarget, marginTop: spacing.lg },
});
