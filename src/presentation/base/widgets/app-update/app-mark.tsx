import { Image, StyleSheet, View } from 'react-native';
import { APP_ICON_ASSET } from '@infrastructure/constants/assets';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import type { UpdateRequiredReasonType } from '@domain/app-version/update-required-reason';
import { UpdateBadge } from '@presentation/base/widgets/app-update/update-badge';

/** The store icon's corner radius as a share of its size (the iOS squircle, rounded). */
const ICON_RADIUS_SHARE = 0.225;

export interface AppMarkProps {
  size: number;
  /** Shows the corner badge (the gate); `undefined` draws the bare icon (the sheet). */
  badgeReason?: UpdateRequiredReasonType | null;
}

/** The app's own store icon — what the user will look for in the store. Decorative. */
export const AppMark = ({ size, badgeReason }: AppMarkProps): React.JSX.Element => (
  <View accessible={false} importantForAccessibility="no-hide-descendants" style={[shadows.md, styles.wrap]}>
    <Image source={APP_ICON_ASSET} style={{ width: size, height: size, borderRadius: size * ICON_RADIUS_SHARE }} />
    {badgeReason !== undefined ? <UpdateBadge markSize={size} reason={badgeReason} /> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
});
