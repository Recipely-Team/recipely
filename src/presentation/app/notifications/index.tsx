import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { useEffect, useMemo, useState } from 'react';
import { useAssistantNotificationActions } from '@presentation/app/notifications/hooks/use-assistant-notification-actions';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { buildSections } from '@presentation/app/notifications/model/build-sections';
import { NotificationFilter, type NotificationFilterType } from '@presentation/app/notifications/model/notification-filter';
import { StoreStatus } from '@application/store/store-status';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import {
  failureContent,
  failureIcon,
  failureSeverity,
} from '@presentation/base/errors/failure-lookups';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings, avatarSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifRow } from '@presentation/app/notifications/items/notif-row';
import { ValueConstants } from '@core/constants';
import { toNotifItem } from '@presentation/app/notifications/model/to-notif-item';
import { NotificationsHeader } from '@presentation/app/notifications/body/notifications-header';
import { NotificationFilterPills } from '@presentation/app/notifications/body/notification-filter-pills';
import { useOpenNotificationTarget } from '@presentation/app/notifications/hooks/use-open-notification-target';

export const NotificationsScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();

  const { notificationsStore } = useStores();
  const state = notificationsStore((s) => s.state);
  const load = notificationsStore((s) => s.load);
  const markAllRead = notificationsStore((s) => s.markAllRead);
  const markOneRead = notificationsStore((s) => s.markOneRead);

  const [filter, setFilter] = useState<NotificationFilterType>(NotificationFilter.All);

  useReportFailure(state.status === StoreStatus.Error ? state.failure : null, 'NotificationsScreen');

  // Load once per mount; opening the screen never clears the badge.
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: NotifItem[] = useMemo(() => {
    if (state.status !== StoreStatus.Loaded) return [];
    return state.items.map(toNotifItem);
  }, [state]);

  const unreadCount =
    state.status === StoreStatus.Loaded ? state.unreadCount : ValueConstants.zero;
  const sections = buildSections(items, filter);

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
    onMarkAllRead: () => void markAllRead(),
    onMarkOneRead: (id: string) => void markOneRead(id),
    onReload: () => void load(),
  });
  const scrollable = useAssistantScrollable();

  const tap = (item: NotifItem): void => {
    if (!item.read) void markOneRead(item.id);
    if (item.target !== null) openTarget(item.target);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ResponsiveContainer route="notifications" gutter={false} fill>
      <NotificationsHeader unreadCount={unreadCount} onBack={() => router.back()} onMarkAllRead={() => void markAllRead()} />
      <NotificationFilterPills filter={filter} totalCount={items.length} unreadCount={unreadCount} onChange={setFilter} />

      {state.status === StoreStatus.Loading || state.status === StoreStatus.Idle ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : state.status === StoreStatus.Error ? (
        <ErrorState
          severity={failureSeverity(state.failure)}
          icon={failureIcon(state.failure)}
          title={failureContent(state.failure).title}
          body={failureContent(state.failure).body}
          primaryLabel={t().errors.retry}
          onPrimary={() => void load()}
        />
      ) : (
      <SectionList
        {...scrollable}
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NotifRow item={item} onTap={tap} />}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <ThemedText variant="caption" muted style={styles.sectionTitle}>
              {upperCase(section.title)}
            </ThemedText>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText variant="body" muted style={{ textAlign: 'center' }}>
              {t().notifications.empty}
            </ThemedText>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />}
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
