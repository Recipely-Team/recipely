import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useInstagramConnection } from '@presentation/base/hooks/instagram/use-instagram-connection';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Keeps the editor and Activity reachable only while an Instagram account is
 * linked: once the link has been read and the feature is off or nothing is
 * linked (a stale tab, an old deep link), the user lands on Automations,
 * which says what to do. `isMissing` (no rule id where one is needed) sends
 * them there too.
 */
export const useAutomationsGuard = (isMissing: boolean): void => {
  const router = useRouter();
  const { instagramStore } = useStores();
  const known = instagramStore((s) => s.connection.status === StoreStatus.Loaded);
  const connection = useInstagramConnection();
  const blocked = isMissing || (known && (!connection.isAvailable || !connection.isConnected));
  useEffect(() => {
    if (blocked) router.replace(RoutePaths.automations);
  }, [blocked, router]);
};
