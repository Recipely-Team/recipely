import { useCallback, useEffect } from 'react';
import { useStore } from 'zustand';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { ListConstants } from '@presentation/base/constants/list-constants';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { PostTile } from '@presentation/app/automations/edit/items/post-tile';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';

export interface PostStepProps {
  /** Lets the assistant move this step's list. */
  scrollable: AssistantScrollableProps;
  handle: string;
  selected: string | null;
  onSelect: (mediaId: string) => void;
}

/**
 * Step 1 (spec §3): the connected account's posts and Reels as a grid —
 * three across on a phone, four once expanded — paged on scroll (the API
 * serves twenty pages at most). Posts another automation watches say so.
 */
export const PostStep = ({ handle, selected, onSelect, scrollable }: PostStepProps): React.JSX.Element => {
  const t = useTranslations();
  // Stable, so a memoized PostTile is not re-rendered by a new arrow on every render.
  const onPressTile = useCallback((media: { id: string }) => onSelect(media.id), [onSelect]);
  const colors = useTheme().colors;
  const { isExpanded } = useLayout();
  const { automationsStore } = useStores();
  const media = useStore(automationsStore, (s) => s.media);
  const rules = useStore(automationsStore, (s) => s.rules);
  const loadMoreMedia = (): void => void automationsStore.getState().loadMoreMedia();
  const watched = new Set(rules.status === StoreStatus.Loaded ? rules.items.map((rule) => rule.mediaId) : []);
  const columns = isExpanded ? AutomationMetrics.gridColumnsWeb : AutomationMetrics.gridColumns;
  const copy = t.instagram;

  useEffect(() => {
    void automationsStore.getState().loadMedia();
  }, [automationsStore]);

  return (
    <FlatList
      // Explicit: FlatList clips by default on Android, which crashes Fabric (rule R).
      removeClippedSubviews={false}
      {...scrollable}
      key={columns}
      data={media.status === StoreStatus.Loaded ? media.items : []}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      accessibilityRole="radiogroup"
      columnWrapperStyle={styles.gap}
      contentContainerStyle={styles.gap}
      renderItem={({ item }) => (
        <PostTile media={item} selected={item.id === selected} hasRule={watched.has(item.id) && item.id !== selected} onPress={onPressTile} />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
            {copy.postTitle}
          </SizedText>
          <SizedText size={fontSizes.caption} color={colors.textSubtle}>
            {copy.postBody.replace('{h}', handle)}
          </SizedText>
        </View>
      }
      ListEmptyComponent={
        media.status === StoreStatus.Loaded ? <SizedText muted size={fontSizes.medium}>{copy.noPosts}</SizedText> : media.status === StoreStatus.Error ? <SizedText muted size={fontSizes.medium}>{copy.loadFailed}</SizedText> : <ActivityIndicator color={colors.primary} />
      }
      ListFooterComponent={
        <FeedFooter
          isLoadingMore={media.status === StoreStatus.Loaded && media.isLoadingMore}
          failure={media.status === StoreStatus.Loaded ? media.moreFailure : null}
          onRetry={loadMoreMedia}
        />
      }
      onEndReached={loadMoreMedia}
      onEndReachedThreshold={ListConstants.endReachedThreshold}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: { flex: ValueConstants.one },
  gap: { gap: spacing.xs2 },
  header: { gap: spacing.xs, paddingBottom: spacing.md },
});
