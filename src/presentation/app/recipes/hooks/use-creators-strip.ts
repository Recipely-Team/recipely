import { useCallback, useEffect } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import type { UseCreatorsStripResult } from '@presentation/app/recipes/model/use-creators-strip-result';

/**
 * Feeds the Explore "Creators" strip from the creators store.
 *
 * @remarks
 * - **Hidden unless there is something to show.** Before the first answer, on
 *   an empty list and on a failed first load the strip is not drawn at all —
 *   an empty shelf with a "See all" reads as a broken feature. A failed
 *   refresh keeps the rows (the store's rule), so the strip stays.
 * - **Loads once.** The store ignores `load` once it has answered, so the feed
 *   re-rendering never re-asks.
 */
export const useCreatorsStrip = (): UseCreatorsStripResult => {
  const router = useRouter();
  const { creatorsStore } = useStores();
  const creators = creatorsStore((s) => s.creators);
  const status = creatorsStore((s) => s.listState.status);
  const load = creatorsStore((s) => s.load);
  const loadMore = creatorsStore((s) => s.loadMore);

  useEffect(() => {
    void load();
  }, [load]);

  const onOpenCreator = useCallback(
    (id: string) => router.push(RoutePaths.creatorProfile(id) as Href),
    [router],
  );

  return {
    creators,
    isVisible: status === StoreStatus.Loaded && creators.length > ValueConstants.zero,
    onOpenCreator,
    onOpenAll: () => router.push(RoutePaths.creators as Href),
    onEndReached: () => void loadMore(),
  };
};
