import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, fontWeights } from '@presentation/base/theme';
import { ownerStatusLook } from '@presentation/base/widgets/badges/owner-status-look';

export interface RecipeStatusBadgeProps {
  status: OwnerStatusType;
}

/**
 * Where one of the owner's recipes stands — private, in review, published or
 * rejected — as a pill on the photo's bottom-left corner of a Created-tab card.
 *
 * @remarks
 * - **On the photo's overlay**, like the card's other chips, so it reads on any
 *   picture; a rejected recipe swaps the overlay for the danger fill, because
 *   that is the one state the owner has to notice.
 */
export const RecipeStatusBadge = ({ status }: RecipeStatusBadgeProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const look = ownerStatusLook[status];
  const rejected = status === OwnerStatus.Rejected;
  const background = rejected ? colors.danger : colors.overlay;
  const foreground = rejected ? colors.primaryText : colors.onOverlay;

  return (
    <View
      style={[styles.badge, { backgroundColor: background }]}
      accessibilityRole="text"
      accessibilityLabel={look.label()}
    >
      <Ionicons name={look.icon} size={iconSizes.sm} color={foreground} />
      <ThemedText variant="caption" style={[styles.label, { color: foreground }]}>
        {look.label()}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  label: {
    fontWeight: fontWeights.semibold,
  },
});
