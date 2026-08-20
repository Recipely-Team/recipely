import { useEffect, useMemo, useState } from 'react';
import { NotificationFilter } from '@presentation/app/notifications/model/notification-filter';
import { NotificationTargetKind } from '@domain/notifications/notification-target-kind';
import { StoreStatus } from '@application/store/store-status';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
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
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, avatarSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotificationTarget } from '@domain/notifications/notification-target';
import type { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import type { SectionData } from '@presentation/app/notifications/model/section-data';
import { NotifRow } from '@presentation/app/notifications/items/notif-row';
import { TimeConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const KNOWN_KINDS = new Set<NotifKind>([
  'comment',
  'like',
  'favorite',
  'ai_done',
  'import_done',
  'moderation_approved',
  'moderation_pending',
  'follow',
]);

const resolveKind = (raw: string): NotifKind => {
  return KNOWN_KINDS.has(raw as NotifKind) ? (raw as NotifKind) : 'generic';
};

const daysSince = (createdAt: Date): number => {
  const ms = Date.now() - createdAt.getTime();
  return Math.max(ValueConstants.zero, Math.floor(
      ms /
        (TimeConstants.millisecondsPerSecond *
          TimeConstants.secondsPerMinute *
          TimeConstants.minutesPerHour *
          TimeConstants.hoursPerDay),
    ));
};

const toNotifItem = (n: NotificationEntity): NotifItem => ({
  id: n.id,
  kind: resolveKind(n.type),
  actor: n.senderDisplayName ?? 'Recipely',
  recipeName: n.recipeTitle ?? undefined,
  daysAgo: daysSince(n.createdAt),
  read: n.read,
  // Surface free-text payload (e.g. the comment body) as the secondary line.
  body: n.message ?? undefined,
  target: n.target,
});

const buildSections = (items: NotifItem[], filter: NotificationFilter): SectionData[] => {
  const visible = filter === NotificationFilter.Unread ? items.filter((n) => !n.read) : items;
  const today = visible.filter((n) => n.daysAgo === ValueConstants.zero);
  const yesterday = visible.filter((n) => n.daysAgo === ValueConstants.one);
  const earlier = visible.filter((n) => n.daysAgo > ValueConstants.one);
  const sections: SectionData[] = [];
  const labels = t().notifications;
  if (today.length > ValueConstants.zero) sections.push({ title: labels.today, data: today });
  if (yesterday.length > ValueConstants.zero) sections.push({ title: labels.yesterday, data: yesterday });
  if (earlier.length > ValueConstants.zero) sections.push({ title: labels.earlier, data: earlier });
  return sections;
};

export const NotificationsScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();

  const { notificationsStore } = useStores();
  const state = notificationsStore((s) => s.state);
  const load = notificationsStore((s) => s.load);
  const markAllRead = notificationsStore((s) => s.markAllRead);
  const markOneRead = notificationsStore((s) => s.markOneRead);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useReportFailure(state.status === StoreStatus.Error ? state.failure : null, 'NotificationsScreen');

  // Load the latest feed once per mount. Notifications stay unread until the
  // user taps them individually or presses the explicit "mark all read" button —
  // opening the screen alone never clears the badge.
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

  // Cast: a dynamic recipe path can't be statically verified against
  // expo-router's typed-routes union — same pattern as useRecipeDetail.
  const openTarget = (target: NotificationTarget): void => {
    // A draft is the one target with no recipe behind it: the import produced
    // something to finish, not something to read. It opens the editor the same
    // way My Recipes does, so a resumed import and a resumed draft are the same
    // screen in the same state.
    if (target.kind === NotificationTargetKind.Draft) {
      router.push({ pathname: RoutePaths.createRecipe, params: { draftId: target.draftId } });
      return;
    }
    const path = RoutePaths.recipeDetail(encodeURIComponent(target.recipeId));
    router.push(
      (target.kind === NotificationTargetKind.Comment
        ? `${path}?commentId=${encodeURIComponent(target.commentId)}`
        : path) as Href,
    );
  };

  const tap = (item: NotifItem): void => {
    if (!item.read) void markOneRead(item.id);
    if (item.target !== null) openTarget(item.target);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ResponsiveContainer route="notifications" gutter={false} fill>
      <View style={[styles.header, { paddingTop: isWebShell ? spacing.md : insets.top + spacing.sm, borderBottomColor: colors.cardBorder }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.chipBackground }]}
          accessibilityRole="button"
          accessibilityLabel={t().notifications.title}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.primary} />
        </Pressable>
        <ThemedText variant="subtitle" style={styles.headerTitle}>
          {t().notifications.title}
        </ThemedText>
        {unreadCount > ValueConstants.zero ? (
          <Pressable
            onPress={() => { void markAllRead(); }}
            style={styles.markReadBtn}
            accessibilityRole="button"
            accessibilityLabel={t().notifications.markRead}
          >
            <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: fontWeights.semibold }}>
              {t().notifications.markRead}
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'unread'] as const).map((f) => {
          const isActive = filter === f;
          const label = f === NotificationFilter.All
            ? `${t().notifications.all} (${items.length})`
            : `${t().notifications.unread} (${unreadCount})`;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isActive ? colors.primary : colors.chipBackground,
                  borderColor: isActive ? colors.primary : colors.cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <ThemedText
                variant="caption"
                style={{ color: isActive ? colors.primaryText : colors.text, fontWeight: fontWeights.semibold }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: ValueConstants.one, textAlign: 'center', fontWeight: fontWeights.bold },
  markReadBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  headerSpacer: { width: controlSizes.iconBtn },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    minHeight: controlSizes.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
