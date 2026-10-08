import { useRouter } from 'expo-router';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { TabAppBarButton } from '@presentation/base/widgets/navigation/tab-app-bar-button';
import { RoutePaths } from '@presentation/base/constants';
import { controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface ShoppingListButtonProps {
  /** The phone's tab app bar button instead of the web header's 44 circle. */
  inTabBar?: boolean;
}

/** My Recipes' way into the shopping list, beside "Create new" in both headers. */
export const ShoppingListButton = ({ inTabBar = false }: ShoppingListButtonProps): React.JSX.Element => {
  const router = useRouter();
  const open = (): void => router.push(RoutePaths.shoppingList);
  return inTabBar ? (
    <TabAppBarButton icon="cart-outline" accessibilityLabel={t().shopping.open} onPress={open} />
  ) : (
    <RoundIconButton icon="cart-outline" accessibilityLabel={t().shopping.open} onPress={open} size={controlSizes.touchTarget} />
  );
};
