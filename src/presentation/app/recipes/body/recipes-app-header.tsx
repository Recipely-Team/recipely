import { StyleSheet, View, Pressable } from 'react-native';
import { UNREAD_BADGE_MAX, UNREAD_BADGE_OVERFLOW_LABEL } from '@presentation/base/constants/interaction-constants';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, decorSizes, borderWidths, BrandColors } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface RecipesAppHeaderProps {
  onNotificationsPress: () => void;
  unreadCount: number;
}

export const RecipesAppHeader = ({
  onNotificationsPress,
  unreadCount,
}: RecipesAppHeaderProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const { isWebShell } = useLayout();
  if (isWebShell) return null;
  const badgeText = unreadCount > UNREAD_BADGE_MAX ? UNREAD_BADGE_OVERFLOW_LABEL : String(unreadCount);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.titles}>
        <RecipelyLogo size={iconSizes.xl} />
        <ThemedText variant="title" style={styles.screenTitle}>
          {t().recipes.title}
        </ThemedText>
      </View>
      <Pressable
        onPress={onNotificationsPress}
        style={[styles.bell, { backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > ValueConstants.zero
            ? `${t().notifications.title}, ${unreadCount}`
            : t().notifications.title
        }
      >
        <Ionicons
          name={unreadCount > ValueConstants.zero ? 'notifications' : 'notifications-outline'}
          size={iconSizes.xl}
          color={colors.text}
        />
        {unreadCount > ValueConstants.zero ? (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.background }]}>
            <ThemedText style={styles.badgeText}>{badgeText}</ThemedText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titles: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  screenTitle: {
    fontWeight: fontWeights.bold,
  },
  bell: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: ValueConstants.zero,
    right: ValueConstants.zero,
    minWidth: decorSizes.notifBadge,
    height: decorSizes.notifBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: fontSizes.nano,
    fontWeight: fontWeights.bold,
    lineHeight: decorSizes.notifBadgeLineHeight,
    includeFontPadding: false,
  },
});
