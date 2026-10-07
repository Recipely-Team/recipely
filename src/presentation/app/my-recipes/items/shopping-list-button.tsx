import { useRouter } from 'expo-router';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { RoutePaths } from '@presentation/base/constants';
import { controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** My Recipes' way into the shopping list, beside "Create new" in both headers. */
export const ShoppingListButton = (): React.JSX.Element => {
  const router = useRouter();
  return (
    <RoundIconButton
      icon="cart-outline"
      accessibilityLabel={t().shopping.open}
      onPress={() => router.push(RoutePaths.shoppingList)}
      size={controlSizes.touchTarget}
    />
  );
};
