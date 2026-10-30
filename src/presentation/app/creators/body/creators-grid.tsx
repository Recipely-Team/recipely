import { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StoreStatus } from '@application/store/store-status';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { ValueConstants } from '@core/constants';
import { ListConstants } from '@presentation/base/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { CreatorCard } from '@presentation/base/widgets/creators/creator-card';
import { ChefsComingSoon } from '@presentation/app/creators/items/chefs-coming-soon';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { CreatorsGridMetrics } from '@presentation/app/creators/model/creators-grid-metrics';
import type { UseCreatorsScreenResult } from '@presentation/app/creators/model/use-creators-screen-result';
import { useTranslations } from '@presentation/i18n';

export interface CreatorsGridProps {
  vm: UseCreatorsScreenResult;
  scrollable: AssistantScrollableProps;
}

const keyOf = (creator: CreatorSummaryEntity): string => creator.id;

/**
 * The Chefs tab's body under its heading, by list state: a spinner before the
 * first answer, the error with a retry, the "coming soon" placeholder, or the card grid.
 * Every settled branch is pull-to-refresh.
 *
 * @remarks
 * - **Rows are recycled (FlashList).** It gives every column an equal share and
 *   has no `columnWrapperStyle`, so each cell pads half the gap on both sides and
 *   the gap below; the list pads the rest of the gutter at the edges.
 */
export const CreatorsGrid = ({ vm, scrollable }: CreatorsGridProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const { listState, onOpenCreator, gap } = vm;
  const cellInset = gap / ValueConstants.two;
  const renderItem = useCallback(
    ({ item }: { item: CreatorSummaryEntity }) => (
      <View style={{ paddingHorizontal: cellInset, paddingBottom: gap }}>
        <CreatorCard creator={item} onOpen={onOpenCreator} />
      </View>
    ),
    [cellInset, gap, onOpenCreator],
  );
  const refreshControl = (
    <RefreshControl refreshing={vm.isPullRefreshing} onRefresh={vm.onRefresh} tintColor={colors.textMuted} colors={[colors.primary]} />
  );
  switch (listState.status) {
    case StoreStatus.Idle:
    case StoreStatus.Loading:
      return (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    case StoreStatus.Error: {
      const content = failureContent(t, listState.failure);
      return (
        <ErrorState
          severity={failureSeverity(listState.failure)}
          icon={failureIcon(listState.failure)}
          title={content.title}
          body={content.body}
          primaryLabel={t.errors.retry}
          onPrimary={vm.onRefresh}
        />
      );
    }
    case StoreStatus.Loaded:
      if (vm.creators.length === ValueConstants.zero) {
        return (
          <ScrollView {...scrollable} contentContainerStyle={styles.emptyContent} refreshControl={refreshControl}>
            <ChefsComingSoon onApply={vm.onApplyAsCreator} />
          </ScrollView>
        );
      }
      return (
        <FlashList
          {...scrollable}
          key={`creators-${vm.columns}`}
          data={vm.creators}
          keyExtractor={keyOf}
          numColumns={vm.columns}
          renderItem={renderItem}
          contentContainerStyle={[styles.content, { paddingHorizontal: CreatorsGridMetrics.gutter - cellInset }]}
          refreshControl={refreshControl}
          onEndReached={vm.onEndReached}
          onEndReachedThreshold={ListConstants.endReachedThreshold}
          ListFooterComponent={
            <FeedFooter
              isLoadingMore={vm.isLoadingMore}
              failure={vm.listState.status === StoreStatus.Loaded ? vm.listState.moreFailure : null}
              onRetry={vm.onEndReached}
            />
          }
        />
      );
  }
};

const styles = StyleSheet.create({
  centre: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  emptyContent: {
    flexGrow: ValueConstants.one,
    paddingHorizontal: CreatorsGridMetrics.gutter,
  },
});
