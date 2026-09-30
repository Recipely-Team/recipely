import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { CountBadge } from '@presentation/base/widgets/text/count-badge';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { borderWidths, controlSizes, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface DiaryAppBarProps {
  /** Hidden once the calendar sits in the page's own rail (an expanded viewport). */
  showCalendar: boolean;
  unreadCount: number;
  onOpenCalendar: () => void;
  onOpenGoals: () => void;
  onOpenNotifications: () => void;
}

/** The Diary tab's top bar on the native shell: title, then calendar · goals · notifications (design spec → Food Diary §4). */
export const DiaryAppBar = ({ showCalendar, unreadCount, onOpenCalendar, onOpenGoals, onOpenNotifications }: DiaryAppBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  return (
    <View style={styles.root}>
      <ThemedText variant="title" accessibilityRole="header" style={styles.title}>
        {strings.title}
      </ThemedText>
      {showCalendar ? (
        <RoundIconButton icon="calendar-outline" accessibilityLabel={strings.openCalendar} onPress={onOpenCalendar} size={controlSizes.floatingBtn} />
      ) : null}
      <RoundIconButton icon="locate-outline" accessibilityLabel={strings.dailyGoals} onPress={onOpenGoals} size={controlSizes.floatingBtn} />
      <Pressable
        onPress={onOpenNotifications}
        accessibilityRole="button"
        accessibilityLabel={unreadCount > ValueConstants.zero ? `${t().notifications.title}, ${unreadCount}` : t().notifications.title}
        style={[styles.bell, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      >
        <Ionicons name={unreadCount > ValueConstants.zero ? 'notifications' : 'notifications-outline'} size={iconSizes.lg} color={colors.text} />
        <CountBadge count={unreadCount} style={styles.badge} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { flex: ValueConstants.one },
  bell: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { top: ValueConstants.zero, right: ValueConstants.zero },
});
