import { useCallback, useEffect, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { autoFillColumns } from '@presentation/base/widgets/creators/auto-fill-columns';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { CreatorsGridMetrics } from '@presentation/app/creators/model/creators-grid-metrics';
import type { UseCreatorsScreenResult } from '@presentation/app/creators/model/use-creators-screen-result';

/**
 * Orchestrates /creators: the same creators store the Explore strip reads,
 * laid out as a grid that pages as it scrolls.
 *
 * @remarks
 * - **Shares the strip's store**, so arriving from "See all" shows the rows
 *   already loaded at once, and scrolling here pages the strip too.
 * - **Two columns on a phone; on an expanded viewport as many 180-wide
 *   cards as fit**, the prototype's `auto-fill, minmax(180, 1fr)`.
 */
export const useCreatorsScreen = (): UseCreatorsScreenResult => {
  const router = useRouter();
  const { width, isExpanded } = useLayout();
  const { creatorsStore } = useStores();
  const listState = creatorsStore((s) => s.creators);
  const load = creatorsStore((s) => s.load);
  const refresh = creatorsStore((s) => s.refresh);
  const loadMore = creatorsStore((s) => s.loadMore);
  const [isPullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const { gutter, minCardWidthExpanded, phoneColumns } = CreatorsGridMetrics;
  const gap = isExpanded ? CreatorsGridMetrics.gapExpanded : CreatorsGridMetrics.gap;
  const contentWidth = Math.min(width, WEB_CONTENT_MAX_WIDTH.creators) - gutter * ValueConstants.two;
  const columns = isExpanded
    ? autoFillColumns(contentWidth, minCardWidthExpanded, gap, phoneColumns)
    : phoneColumns;

  const onRefresh = useCallback(() => {
    setPullRefreshing(true);
    void refresh().finally(() => setPullRefreshing(false));
  }, [refresh]);

  const onOpenCreator = useCallback(
    (id: string) => router.push(RoutePaths.creatorProfile(id) as Href),
    [router],
  );

  return {
    creators: loadedItems(listState),
    listState,
    columns,
    gap,
    cellWidth: (contentWidth - gap * (columns - ValueConstants.one)) / columns,
    isPullRefreshing,
    isLoadingMore: listState.status === StoreStatus.Loaded && listState.isLoadingMore,
    onRefresh,
    onEndReached: () => void loadMore(),
    onOpenCreator,
  };
};
