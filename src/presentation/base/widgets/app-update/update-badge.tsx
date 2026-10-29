import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, radii } from '@presentation/base/theme';
import { UpdateRequiredReason, type UpdateRequiredReasonType } from '@domain/app-version/update-required-reason';

/** Badge diameter as a share of the mark, its glyph as a share of the badge, its offset past the mark's corner. */
const BADGE_SHARE = 0.36;
const GLYPH_SHARE = 0.56;
const OFFSET_SHARE = -0.28;

export interface UpdateBadgeProps {
  /** The app mark's size; the badge is drawn from it. */
  markSize: number;
  reason: UpdateRequiredReasonType | null;
}

/**
 * The corner badge on the update gate's app mark: a download arrow on the
 * primary colour, or "!" on danger for a pulled release. Decorative — the title
 * and body say the same thing to a screen reader.
 */
export const UpdateBadge = ({ markSize, reason }: UpdateBadgeProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const size = Math.round(markSize * BADGE_SHARE);
  const isBlocked = reason === UpdateRequiredReason.Blocked;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          right: size * OFFSET_SHARE,
          bottom: size * OFFSET_SHARE,
          backgroundColor: isBlocked ? colors.danger : colors.primary,
          borderColor: colors.background,
        },
      ]}
    >
      <Ionicons
        name={isBlocked ? 'alert' : 'arrow-down'}
        size={Math.round(size * GLYPH_SHARE)}
        color={isBlocked ? colors.onDanger : colors.primaryText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    borderRadius: radii.round,
    borderWidth: borderWidths.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
