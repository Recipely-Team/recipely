import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  controlSizes,
  decorSizes,
  borderWidths,
  opacities,
  BrandColors,
} from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

const NOTIF_BTN_SIZE = controlSizes.webHeaderBtn;
const AVATAR_SIZE = 36;

export interface WebHeaderActionsProps {
  createLabel: string;
  notificationsLabel: string;
  profileLabel: string;
  unreadCount: number;
  isProfileActive: boolean;
  avatarName: string;
  avatarUri?: string;
  /** Guest-only Discover entry to the onboarding screen (recipes tab only). */
  discoverLabel?: string;
  onCreate: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onDiscover?: () => void;
}

/** Right cluster: Create CTA + notifications bell with badge + avatar route to profile. */
export const WebHeaderActions = ({
  createLabel,
  notificationsLabel,
  profileLabel,
  unreadCount,
  isProfileActive,
  avatarName,
  avatarUri,
  discoverLabel,
  onCreate,
  onOpenNotifications,
  onOpenProfile,
  onDiscover,
}: WebHeaderActionsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
  const showDiscover = discoverLabel !== undefined && onDiscover !== undefined;

  return (
    <View style={styles.row}>
      {showDiscover ? (
        <Pressable
          onPress={onDiscover}
          accessibilityRole="button"
          accessibilityLabel={discoverLabel}
          style={({ pressed }) => [
            styles.discoverBtn,
            {
              borderColor: colors.cardBorder,
              opacity: pressed ? opacities.pressedSubtle : opacities.full,
            },
          ]}
        >
          <Ionicons name="sparkles" size={15} color={colors.primary} />
          <ThemedText style={[styles.createLabel, { color: colors.text }]}>
            {discoverLabel}
          </ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        accessibilityLabel={createLabel}
        style={({ pressed }) => [
          styles.createBtn,
          shadows.sm,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? opacities.pressedSubtle : opacities.full,
          },
        ]}
      >
        <Ionicons name="add" size={16} color={colors.primaryText} />
        <ThemedText style={[styles.createLabel, { color: colors.primaryText }]}>
          {createLabel}
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={onOpenNotifications}
        accessibilityRole="button"
        accessibilityLabel={notificationsLabel}
        style={({ pressed }) => [
          styles.iconBtn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            opacity: pressed ? opacities.pressedSubtle : opacities.full,
          },
        ]}
      >
        <Ionicons
          name={unreadCount > ValueConstants.zero ? 'notifications' : 'notifications-outline'}
          size={18}
          color={colors.text}
        />
        {unreadCount > ValueConstants.zero ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.danger, borderColor: colors.background },
            ]}
          >
            <ThemedText style={styles.badgeText}>{badgeText}</ThemedText>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={profileLabel}
        style={({ pressed }) => [
          styles.avatarBtn,
          {
            borderColor: isProfileActive ? colors.primary : colors.cardBorder,
            backgroundColor: isProfileActive ? colors.chipBackground : colors.surface,
            opacity: pressed ? opacities.pressedSubtle : opacities.full,
          },
        ]}
      >
        <AvatarImage name={avatarName} uri={avatarUri} size={AVATAR_SIZE - 4} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: NOTIF_BTN_SIZE,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: NOTIF_BTN_SIZE,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    backgroundColor: 'transparent',
  },
  createLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  iconBtn: {
    width: NOTIF_BTN_SIZE,
    height: NOTIF_BTN_SIZE,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    minWidth: decorSizes.notifBadge,
    minHeight: decorSizes.notifBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    lineHeight: decorSizes.notifBadgeLineHeight,
    includeFontPadding: false,
  },
  avatarBtn: {
    width: NOTIF_BTN_SIZE,
    height: NOTIF_BTN_SIZE,
    borderRadius: NOTIF_BTN_SIZE / 2,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
