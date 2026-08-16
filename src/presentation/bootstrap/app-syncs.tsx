import type { ReactNode } from 'react';
import type { Stores } from '@presentation/bootstrap/stores';
import { useTimerNotificationSync } from '@presentation/base/hooks/timers/use-timer-notification-sync';
import { useUnreadNotificationsSync } from '@presentation/base/hooks/sync/use-unread-notifications-sync';
import { useTaxonomySync } from '@presentation/base/hooks/sync/use-taxonomy-sync';
import { useAdsWarmup } from '@presentation/base/hooks/ads/use-ads-warmup';

export interface AppSyncsProps {
  stores: Stores;
  children: ReactNode;
}

/**
 * Hosts the background sync hooks that issue backend requests on mount, keeping
 * `AppBootstrap` down to composition + the one-shot init effects.
 *
 * These requests do not need a locale gate: the HTTP client's async
 * `localeProvider` makes every request await the saved-language restore, so the
 * taxonomy catalogs here can fire on mount and still come back in the user's
 * language rather than the device's.
 */
export const AppSyncs = ({ stores, children }: AppSyncsProps): React.JSX.Element => {
  useTimerNotificationSync();
  useUnreadNotificationsSync(stores.notificationsStore, stores.authStore);
  useTaxonomySync(stores.taxonomyStore, stores.authStore);
  useAdsWarmup();

  return <>{children}</>;
};
