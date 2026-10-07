import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface NotificationsHeaderProps {
  unreadCount: number;
  onBack: () => void;
  onMarkAllRead: () => void;
}

/** Back, title, and "mark all read" — shown only while something is unread; a spacer keeps the title centred otherwise. */
export const NotificationsHeader = ({ unreadCount, onBack, onMarkAllRead }: NotificationsHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  return (
    <View style={[styles.header, { paddingTop: isWebShell ? spacing.md : insets.top + spacing.sm, borderBottomColor: colors.cardBorder }]}>
      <Pressable
        onPress={onBack}
        style={[styles.backBtn, { backgroundColor: colors.chipBackground }]}
        accessibilityRole="button"
        accessibilityLabel={t().common.back}
      >
        <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.primary} />
      </Pressable>
      <ThemedText variant="subtitle" style={styles.headerTitle}>
        {t().notifications.title}
      </ThemedText>
      {unreadCount > ValueConstants.zero ? (
        <Pressable
          onPress={onMarkAllRead}
          style={styles.markReadBtn}
          accessibilityRole="button"
          accessibilityLabel={t().notifications.markRead}
        >
          <ThemedText variant="caption" style={[styles.markReadLabel, { color: colors.primary }]}>
            {t().notifications.markRead}
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  markReadLabel: { fontWeight: fontWeights.semibold },
  headerSpacer: { width: controlSizes.iconBtn },
});
