import { useEffect } from 'react';
import type { RecentFood } from '@domain/diary/foods/search/recent-food';
import { useStores } from '@presentation/bootstrap/use-stores';
import { FoodPickList } from '@presentation/base/widgets/diary/add-food/pick/food-pick-list';
import { PickSkeleton } from '@presentation/base/widgets/diary/add-food/pick/pick-skeleton';
import { PickMessage } from '@presentation/base/widgets/diary/add-food/pick/pick-message';
import { pagedRows } from '@presentation/base/widgets/diary/add-food/list/paged-rows';
import { phaseOfLists } from '@presentation/base/widgets/diary/add-food/list/phase-of-lists';
import { PickPhase } from '@presentation/base/widgets/diary/add-food/list/pick-phase';
import { PickRowType } from '@presentation/base/widgets/diary/add-food/list/pick-row-type';
import { t } from '@presentation/i18n';

export interface RecentTabBodyProps {
  onChooseRecent: (recent: RecentFood) => void;
}

const RECENT = 'recent';

/**
 * The Recent tab (Add food v2 spec §4): what the user logged before, most
 * recent first, paged on scroll and reloaded each time the tab opens. A
 * product re-logs at its own unit and quantity.
 */
export const RecentTabBody = ({ onChooseRecent }: RecentTabBodyProps): React.JSX.Element => {
  const { foodCatalogStore } = useStores();
  const recent = foodCatalogStore((s) => s.recent);
  const strings = t().diary;

  useEffect(() => {
    void foodCatalogStore.getState().loadRecent();
  }, [foodCatalogStore]);

  const phase = phaseOfLists([recent]);
  switch (phase.phase) {
    case PickPhase.Loading:
      return <PickSkeleton />;
    case PickPhase.Error:
      return (
        <PickMessage
          title={strings.loadFailed}
          hint={null}
          action={{ label: strings.tryAgain, icon: 'refresh', onPress: () => void foodCatalogStore.getState().loadRecent() }}
        />
      );
    case PickPhase.Empty:
      return <PickMessage title={strings.recentEmpty} hint={null} action={null} />;
    case PickPhase.Ready:
      return (
        <FoodPickList
          rows={pagedRows(recent, RECENT, (item) => ({ type: PickRowType.Recent, key: item.key, recent: item }))}
          onEndReached={() => void foodCatalogStore.getState().loadMoreRecent()}
          onPickRecent={onChooseRecent}
          onRetryMore={() => void foodCatalogStore.getState().loadMoreRecent()}
        />
      );
  }
};
