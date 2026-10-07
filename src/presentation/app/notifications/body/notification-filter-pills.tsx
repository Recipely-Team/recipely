import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { NotificationFilter, type NotificationFilterType } from '@presentation/app/notifications/model/notification-filter';

export interface NotificationFilterPillsProps {
  filter: NotificationFilterType;
  totalCount: number;
  unreadCount: number;
  onChange: (filter: NotificationFilterType) => void;
}

/** All / Unread switch, each pill carrying its count. */
export const NotificationFilterPills = ({ filter, totalCount, unreadCount, onChange }: NotificationFilterPillsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.filterRow}>
      {Object.values(NotificationFilter).map((f) => {
        const isActive = filter === f;
        const label = f === NotificationFilter.All
          ? `${t().notifications.all} (${totalCount})`
          : `${t().notifications.unread} (${unreadCount})`;
        return (
          <Pressable
            key={f}
            onPress={() => onChange(f)}
            style={[
              styles.filterPill,
              {
                backgroundColor: isActive ? colors.primary : colors.chipBackground,
                borderColor: isActive ? colors.primary : colors.cardBorder,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <ThemedText variant="caption" style={[styles.pillLabel, { color: isActive ? colors.primaryText : colors.text }]}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
  pillLabel: { fontWeight: fontWeights.semibold },
});
