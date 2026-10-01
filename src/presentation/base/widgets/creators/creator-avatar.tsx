import { StyleSheet, View } from 'react-native';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { borderWidths, spacing } from '@presentation/base/theme';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';

export interface CreatorAvatarProps {
  name: string;
  photoUrl: string | null;
  platform: CreatorPlatformType;
  size: number;
  markSize: number;
  /** What the avatar sits on; the seal is cut out of it with a halo of this colour. */
  groundColor: string;
}

/** The seal sits 2 off the avatar's corner; its halo reaches 2 further. */
const MARK_OFFSET = -(spacing.xxs + borderWidths.medium);

/** A creator's avatar with their platform seal tucked into the bottom-right corner. */
export const CreatorAvatar = ({ name, photoUrl, platform, size, markSize, groundColor }: CreatorAvatarProps): React.JSX.Element => (
  <View style={{ width: size, height: size }}>
    <AvatarImage uri={photoUrl ?? undefined} name={name} size={size} />
    <View style={styles.mark}>
      <CreatorPlatformMark platform={platform} size={markSize} haloColor={groundColor} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
    right: MARK_OFFSET,
    bottom: MARK_OFFSET,
    zIndex: ValueConstants.one,
  },
});
