import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { TabAppBarButton } from '@presentation/base/widgets/navigation/tab-app-bar-button';
import { CountBadge } from '@presentation/base/widgets/text/count-badge';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * The notifications bell every tab app bar ends with: the bar's own round
 * button, filled glyph and a count badge while anything is unread.
 *
 * @remarks
 * - **Reads the unread count itself** and opens /notifications itself, so the
 *   five tab screens place it without threading store state through props.
 */
export const NotificationsBellButton = (): React.JSX.Element => {
  const router = useRouter();
  const { notificationsStore } = useStores();
  const unreadCount = notificationsStore((s) => s.unreadCount);
  const hasUnread = unreadCount > ValueConstants.zero;
  return (
    <View>
      <TabAppBarButton
        icon={hasUnread ? 'notifications' : 'notifications-outline'}
        accessibilityLabel={hasUnread ? `${t().notifications.title}, ${unreadCount}` : t().notifications.title}
        onPress={() => router.push(RoutePaths.notifications)}
      />
      <CountBadge count={unreadCount} style={styles.badge} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Placement only; the badge's own shape and colours are the widget's.
  badge: { top: -spacing.xxs, right: -spacing.xxs },
});
