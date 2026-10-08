import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { t } from '@presentation/i18n';

/** The Profile tab's bar on the native shell: the shared tab bar with the notifications bell (design spec → Tab app bar). */
export const ProfileAppBar = (): React.JSX.Element => (
  <TabAppBar title={t().navigation.profile} actions={<NotificationsBellButton />} />
);
