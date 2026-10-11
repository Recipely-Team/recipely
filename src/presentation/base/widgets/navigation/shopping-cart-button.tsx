import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { useGuestRouteGate } from '@presentation/base/hooks/auth/use-guest-route-gate';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { TabAppBarButton } from '@presentation/base/widgets/navigation/tab-app-bar-button';
import { CountBadge } from '@presentation/base/widgets/text/count-badge';
import { CountBadgeTone } from '@presentation/base/widgets/text/count-badge-tone';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * The shopping cart every tab app bar carries just left of the bell (design
 * spec → Navigation entry points): the bar's round button with a `primary`
 * badge counting the lines still to buy.
 *
 * @remarks
 * - **Why it exists**: the list was reachable only from a row deep in Profile,
 *   a button in My Recipes and success toasts — the basket was hidden.
 * - **Reads the count itself** (`shoppingListStore.toBuy`, the server's count —
 *   the list is paged) and opens /shopping-list itself, like the bell.
 * - **Primary, not red**: a to-do count, not an alert; hidden at 0, 99+ above 99.
 * - **A guest gets a reason**, not a login wall ({@link useGuestRouteGate}).
 */
export const ShoppingCartButton = (): React.JSX.Element => {
  const router = useRouter();
  const gate = useGuestRouteGate();
  const { authStore, shoppingListStore } = useStores();
  const signedIn = authStore((s) => s.state.status === StoreStatus.Authenticated);
  const toBuy = shoppingListStore((s) => s.toBuy) ?? ValueConstants.zero;

  useEffect(() => {
    if (signedIn) void shoppingListStore.getState().loadToBuy();
  }, [shoppingListStore, signedIn]);

  return (
    <View>
      <TabAppBarButton
        icon="cart-outline"
        accessibilityLabel={toBuy > ValueConstants.zero ? t().shopping.cartA11y.replace('{n}', String(toBuy)) : t().shopping.title}
        onPress={() => gate.open(RoutePaths.shoppingList, (path) => router.push(path as Href))}
      />
      <CountBadge count={toBuy} tone={CountBadgeTone.ToDo} style={styles.badge} />
      <SignInPromptSheet {...gate.prompt} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Placement only; the badge's own shape and colours are the widget's.
  badge: { top: -spacing.xxs, right: -spacing.xxs },
});
