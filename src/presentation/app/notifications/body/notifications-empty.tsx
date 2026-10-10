import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { controlSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface NotificationsEmptyProps {
  /** The Unread filter is on while read notifications exist: say "all caught up", not "nothing yet". */
  caughtUp: boolean;
  onShowAll: () => void;
}

/**
 * The inbox's empty list. With the Unread filter on and older notifications
 * still there, it says the user is all caught up and offers "Show all" — the
 * generic "No notifications yet" read as if the feed were empty.
 */
export const NotificationsEmpty = ({ caughtUp, onShowAll }: NotificationsEmptyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.empty}>
      <ThemedText variant="body" muted style={styles.centerText}>
        {caughtUp ? t().notifications.caughtUp : t().notifications.empty}
      </ThemedText>
      {caughtUp ? (
        <Pressable onPress={onShowAll} accessibilityRole="button" style={styles.showAll}>
          <ThemedText variant="body" style={[styles.showAllText, { color: colors.primary }]}>
            {t().notifications.showAll}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { padding: spacing.xxxl, alignItems: 'center' },
  centerText: { textAlign: 'center' },
  showAll: { minHeight: controlSizes.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md },
  showAllText: { fontWeight: fontWeights.bold },
});
