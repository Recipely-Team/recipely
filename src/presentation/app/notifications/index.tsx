import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { useStore } from 'zustand';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAssistantNotificationActions } from '@presentation/app/notifications/hooks/use-assistant-notification-actions';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { buildSections } from '@presentation/app/notifications/model/build-sections';
import { NotificationsEmpty } from '@presentation/app/notifications/body/notifications-empty';
import { NotificationFilter, type NotificationFilterType } from '@presentation/app/notifications/model/notification-filter';
import { StoreStatus } from '@application/store/store-status';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View, type SectionListData } from 'react-native';
import { useInboxActions } from '@presentation/app/notifications/hooks/use-inbox-actions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { ListConstants } from '@presentation/base/constants';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import {
  failureContent,
  failureIcon,
  failureSeverity,
} from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings, avatarSizes } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifRow } from '@presentation/app/notifications/items/notif-row';
import { ValueConstants } from '@core/constants';
import { useNotifItems } from '@presentation/app/notifications/hooks/use-notif-items';
import { NotificationsHeader } from '@presentation/app/notifications/body/notifications-header';
import { NotificationFilterPills } from '@presentation/app/notifications/body/notification-filter-pills';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { useOpenNotificationTarget } from '@presentation/app/notifications/hooks/use-open-notification-target';

// Module-level so their identity is stable: an inline separator remounts on every render.
const notifKey = (item: NotifItem): string => String(item.id);
const NotifSeparator = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />;
};

/**
 * The viewer's notifications, filtered and grouped into sections, paged on scroll.
 *
 * @remarks
 * **Every list callback keeps its identity** (`useMemo` sections, `useCallback`
 * renderers, a module-level key and separator) so the memoised rows re-render
 * only when their own notification changes.
 */
export const NotificationsScreen = (): React.JSX.Element => {
  const t = useTranslations();
  const goBackOrHome = useGoBackOrHome();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();

  const { notificationsStore } = useStores();
  const state = useStore(notificationsStore, (s) => s.state);
  const load = useStore(notificationsStore, (s) => s.load);
  const loadMore = useStore(notificationsStore, (s) => s.loadMore);
  const unreadCount = useStore(notificationsStore, (s) => s.unreadCount);
  const markOneRead = useStore(notificationsStore, (s) => s.markOneRead);

  const [filter, setFilter] = useState<NotificationFilterType>(NotificationFilter.All);
  const { isRefreshing, refresh, markAll } = useInboxActions();

  useReportFailure(state.status === StoreStatus.Error ? state.failure : null, 'NotificationsScreen');

  // Load once per mount; opening the screen never clears the badge.
  useEffect(() => {
    void load();
  }, [load]);

  const items = useNotifItems(state);

  // Section titles are translated: a language switch rebuilds them.
  const sections = useMemo(() => buildSections(t, items, filter), [t, items, filter]);

  const openTarget = useOpenNotificationTarget();

  // In render order, so "the second one" is the second visible row.
  const visibleItems = useMemo(() => sections.flatMap((section) => section.data), [sections]);
  useAssistantNotificationActions({
    listState:
      state.status === StoreStatus.Loaded
        ? ListState.Ready
        : state.status === StoreStatus.Error
          ? ListState.Failed
          : ListState.Loading,
    unreadCount,
    items: visibleItems,
    onMarkAllRead: markAll,
    onMarkOneRead: (id: string) => void markOneRead(id),
    onReload: () => void load(),
  });
  const scrollable = useAssistantScrollable();

  const tap = useCallback(
    (item: NotifItem): void => {
      if (!item.read) void markOneRead(item.id);
      if (item.target !== null) openTarget(item.target);
    },
    [markOneRead, openTarget],
  );
  const renderItem = useCallback(({ item }: { item: NotifItem }) => <NotifRow item={item} onTap={tap} />, [tap]);
  const sectionBackground = colors.background;
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<NotifItem, { title: string }> }) => (
      <View style={[styles.sectionHeader, { backgroundColor: sectionBackground }]}>
        <ThemedText variant="caption" muted style={styles.sectionTitle}>
          {upperCase(section.title)}
        </ThemedText>
      </View>
    ),
    [sectionBackground],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ResponsiveContainer route="notifications" gutter={false} fill>
      <NotificationsHeader unreadCount={unreadCount} onBack={goBackOrHome} onMarkAllRead={markAll} />
      <NotificationFilterPills filter={filter} totalCount={state.status === StoreStatus.Loaded ? Math.max(state.total, items.length) : items.length} unreadCount={unreadCount} onChange={setFilter} />

      {state.status === StoreStatus.Loading || state.status === StoreStatus.Idle ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : state.status === StoreStatus.Error ? (
        <ErrorState
          severity={failureSeverity(state.failure)}
          icon={failureIcon(state.failure)}
          title={failureContent(t, state.failure).title}
          body={failureContent(t, state.failure).body}
          primaryLabel={t.errors.retry}
          onPrimary={() => void load()}
        />
      ) : (
      <SectionList
        // Explicit: FlatList clips by default on Android, which crashes Fabric (rule R).
        removeClippedSubviews={false}
        initialNumToRender={ListConstants.initialRows}
        maxToRenderPerBatch={ListConstants.rowsPerBatch}
        windowSize={ListConstants.windowSize}
        {...scrollable}
        sections={sections}
        keyExtractor={notifKey}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <NotificationsEmpty
            caughtUp={filter === NotificationFilter.Unread && items.length > ValueConstants.zero}
            onShowAll={() => setFilter(NotificationFilter.All)}
          />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={ListConstants.endReachedThreshold}
        ListFooterComponent={
          <FeedFooter
            isLoadingMore={state.isLoadingMore}
            failure={state.moreFailure}
            onRetry={() => void loadMore()}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        ItemSeparatorComponent={NotifSeparator}
      />
      )}
      </ResponsiveContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wider,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg + avatarSizes.md + spacing.md },
  listContent: {},
  empty: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
