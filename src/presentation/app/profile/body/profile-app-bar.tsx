import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { ShoppingCartButton } from '@presentation/base/widgets/navigation/shopping-cart-button';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { useTranslations } from '@presentation/i18n';

/** The Profile tab's bar on the native shell: the shared tab bar with the notifications bell (design spec → Tab app bar). */
export const ProfileAppBar = (): React.JSX.Element => {
  const t = useTranslations();
  return (
  <TabAppBar
    title={t.navigation.profile}
    actions={
      <>
        <ShoppingCartButton />
        <NotificationsBellButton />
      </>
    }
  />
);
};
