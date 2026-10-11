import { Pressable, StyleSheet, View } from 'react-native';
import { CountBadge } from '@presentation/base/widgets/text/count-badge';
import { CountBadgeTone } from '@presentation/base/widgets/text/count-badge-tone';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  iconSizes,
  BrandColors,
  avatarSizes,
} from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { countBadgeLabel } from '@presentation/base/widgets/text/count-badge-label';

const NOTIF_BTN_SIZE = controlSizes.webHeaderBtn;

export interface WebHeaderActionsProps {
  createLabel: string;
  notificationsLabel: string;
  /** The cart's label — with the count when anything is to buy. */
  cartLabel: string;
  /** Shopping-list lines still to buy; the cart's `primary` badge (hidden at 0). */
  toBuy: number;
  /** On /shopping-list: the cart is drawn active. */
  isCartActive: boolean;
  onOpenCart: () => void;
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

/** Right cluster: Create CTA + shopping cart with its to-buy badge + notifications bell with badge + avatar route to profile. */
export const WebHeaderActions = ({
  createLabel,
  notificationsLabel,
  cartLabel,
  toBuy,
  isCartActive,
  onOpenCart,
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
  const badgeText = countBadgeLabel(unreadCount);
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
          <Ionicons name="sparkles" size={iconSizes.md} color={colors.primary} />
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
        <Ionicons name="add" size={iconSizes.md} color={colors.primaryText} />
        <ThemedText style={[styles.createLabel, { color: colors.primaryText }]}>
          {createLabel}
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={onOpenCart}
        accessibilityRole="button"
        accessibilityLabel={cartLabel}
        accessibilityState={{ selected: isCartActive }}
        style={({ pressed }) => [
          styles.iconBtn,
          {
            backgroundColor: colors.surface,
            borderColor: isCartActive ? colors.primary : colors.cardBorder,
            opacity: pressed ? opacities.pressedSubtle : opacities.full,
          },
        ]}
      >
        <Ionicons name="cart-outline" size={iconSizes.lg} color={isCartActive ? colors.primary : colors.text} />
        <CountBadge count={toBuy} tone={CountBadgeTone.ToDo} style={styles.cartBadge} />
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
          size={iconSizes.lg}
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
        <AvatarImage name={avatarName} uri={avatarUri} size={avatarSizes.xs} />
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
    backgroundColor: BrandColors.transparent,
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
  cartBadge: { top: -spacing.xs, right: -spacing.xs },
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
    borderRadius: NOTIF_BTN_SIZE / ValueConstants.two,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
