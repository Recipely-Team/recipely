import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { t } from '@presentation/i18n';

export interface CreatorBadgeProps {
  /** 22 beside the phone Profile's name, 20 on the web Profile, 18 in the Approved status card. */
  size: number;
}

/**
 * The approved-creator mark: a `primary` disc with a check, beside a name.
 * `primaryText` on `primary` clears 5.6:1 in every palette (design spec §1).
 */
export const CreatorBadge = ({ size }: CreatorBadgeProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t().creators.approvedBadge}
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / ValueConstants.two, backgroundColor: colors.primary },
      ]}
    >
      <Ionicons name="checkmark-sharp" size={Math.round(size * creatorMarkGeometry.badgeCheckShare)} color={colors.primaryText} />
    </View>
  );
};

const styles = StyleSheet.create({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
