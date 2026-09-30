import { useCallback, useEffect, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { CreatorCardSize } from '@presentation/base/widgets/creators/creator-card-size';
import { creatorGridColumns } from '@presentation/base/widgets/creators/creator-grid-columns';
import { useCreatorsBack } from '@presentation/app/creators/shared/hooks/use-creators-back';
import { CreatorsGridMetrics } from '@presentation/app/creators/model/creators-grid-metrics';
import type { UseCreatorsScreenResult } from '@presentation/app/creators/model/use-creators-screen-result';

/**
 * Orchestrates /creators: the same creators store the Explore strip reads,
 * laid out as a grid that pages as it scrolls.
 *
 * @remarks
 * - **Shares the strip's store**, so arriving from "See all" shows the rows
 *   already loaded at once, and scrolling here pages the strip too.
 * - **Columns come from the content width** (two on a phone, up to six), and
 *   the expanded viewport draws the wide card, as on Explore.
 */
export const useCreatorsScreen = (): UseCreatorsScreenResult => {
  const router = useRouter();
  const onBack = useCreatorsBack();
  const { width, isExpanded } = useLayout();
  const { creatorsStore } = useStores();
  const creators = creatorsStore((s) => s.creators);
  const listState = creatorsStore((s) => s.listState);
  const load = creatorsStore((s) => s.load);
  const refresh = creatorsStore((s) => s.refresh);
  const loadMore = creatorsStore((s) => s.loadMore);
  const [isPullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const { gap, gutter } = CreatorsGridMetrics;
  const contentWidth = Math.min(width, WEB_CONTENT_MAX_WIDTH.creators) - gutter * ValueConstants.two;
  const columns = creatorGridColumns(contentWidth, gap);

  const onRefresh = useCallback(() => {
    setPullRefreshing(true);
    void refresh().finally(() => setPullRefreshing(false));
  }, [refresh]);

  const onOpenCreator = useCallback(
    (id: string) => router.push(RoutePaths.creatorProfile(id) as Href),
    [router],
  );

  return {
    creators,
    listState,
    columns,
    cellWidth: (contentWidth - gap * (columns - ValueConstants.one)) / columns,
    cardSize: isExpanded ? CreatorCardSize.Wide : CreatorCardSize.Compact,
    isPullRefreshing,
    isLoadingMore: listState.status === StoreStatus.Loaded && listState.isLoadingMore === true,
    onRefresh,
    onEndReached: () => void loadMore(),
    onOpenCreator,
    onBack,
  };
};
