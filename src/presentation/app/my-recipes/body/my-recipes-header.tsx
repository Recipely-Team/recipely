import { RoundIconButtonTone } from '@presentation/base/widgets/buttons/round-icon-button-tone';
import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { TabAppBarButton } from '@presentation/base/widgets/navigation/tab-app-bar-button';
import { ShoppingCartButton } from '@presentation/base/widgets/navigation/shopping-cart-button';
import { t } from '@presentation/i18n';

export interface MyRecipesHeaderProps {
  onCreate: () => void;
}

/** Mobile My-Recipes bar: the shared tab bar with the shopping list, a primary "Create new" and the bell (design spec → Tab app bar). */
export const MyRecipesHeader = ({ onCreate }: MyRecipesHeaderProps): React.JSX.Element => (
  <TabAppBar
    title={t().myRecipes.title}
    actions={
      <>
        <TabAppBarButton icon="add" accessibilityLabel={t().myRecipes.createNew} onPress={onCreate} tone={RoundIconButtonTone.Primary} />
        <ShoppingCartButton />
        <NotificationsBellButton />
      </>
    }
  />
);
