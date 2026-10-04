import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { ChefsEmpty } from '@presentation/app/creators/items/chefs-empty';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { CreatorsGridMetrics } from '@presentation/app/creators/model/creators-grid-metrics';
import type { UseCreatorsScreenResult } from '@presentation/app/creators/model/use-creators-screen-result';
import { t } from '@presentation/i18n';

export interface CreatorsGridProps {
  vm: UseCreatorsScreenResult;
  scrollable: AssistantScrollableProps;
}

const keyOf = (creator: CreatorSummaryEntity): string => creator.id;

/**
 * The Chefs tab's body under its heading, by list state: a spinner before the
 * first answer, the error with a retry, the chef-hat empty state, or the card grid.
 * Every settled branch is pull-to-refresh.
 */
export const CreatorsGrid = ({ vm, scrollable }: CreatorsGridProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { listState, onOpenCreator, cellWidth, gap } = vm;
  const renderItem = useCallback(
    ({ item }: { item: CreatorSummaryEntity }) => (
      <View style={{ width: cellWidth }}>
        <CreatorCard creator={item} onOpen={onOpenCreator} />
      </View>
    ),
    [cellWidth, onOpenCreator],
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
      const content = failureContent(listState.failure);
      return (
        <ErrorState
          severity={failureSeverity(listState.failure)}
          icon={failureIcon(listState.failure)}
          title={content.title}
          body={content.body}
          primaryLabel={t().errors.retry}
          onPrimary={vm.onRefresh}
        />
      );
    }
    case StoreStatus.Loaded:
      if (vm.creators.length === ValueConstants.zero) {
        return (
          <ScrollView {...scrollable} contentContainerStyle={styles.emptyContent} refreshControl={refreshControl}>
            <ChefsEmpty />
          </ScrollView>
        );
      }
      return (
        <FlatList
          {...scrollable}
          key={`creators-${vm.columns}`}
          data={vm.creators}
          keyExtractor={keyOf}
          numColumns={vm.columns}
          renderItem={renderItem}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={[styles.content, { gap }]}
          refreshControl={refreshControl}
          onEndReached={vm.onEndReached}
          onEndReachedThreshold={ListConstants.endReachedThreshold}
          ListFooterComponent={<FeedFooter isLoadingMore={vm.isLoadingMore} />}
          initialNumToRender={ListConstants.initialRows}
          maxToRenderPerBatch={ListConstants.rowsPerBatch}
          windowSize={ListConstants.windowSize}
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
    paddingHorizontal: CreatorsGridMetrics.gutter,
    paddingBottom: spacing.xxl,
  },
  emptyContent: {
    flexGrow: ValueConstants.one,
    paddingHorizontal: CreatorsGridMetrics.gutter,
  },
});
