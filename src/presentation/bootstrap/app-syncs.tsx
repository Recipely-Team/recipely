import type { ReactNode } from 'react';
import type { Stores } from '@presentation/bootstrap/stores';
import { useTimerNotificationSync } from '@presentation/base/hooks/timers/use-timer-notification-sync';
import { useUnreadNotificationsSync } from '@presentation/base/hooks/sync/use-unread-notifications-sync';
import { useTaxonomySync } from '@presentation/base/hooks/sync/use-taxonomy-sync';
import { useAdsWarmup } from '@presentation/base/hooks/ads/use-ads-warmup';
import { useScreenTracking } from '@presentation/bootstrap/use-screen-tracking';

export interface AppSyncsProps {
  stores: Stores;
  children: ReactNode;
}

/**
 * Hosts the background sync hooks that issue backend requests on mount, keeping
 * `AppBootstrap` down to composition + the one-shot init effects. Screen-view
 * reporting joins them here rather than in the root layout: it reaches into
 * infrastructure, and only the composition root may (rule 17).
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
  useScreenTracking();

  return <>{children}</>;
};
