import { StyleSheet, View } from 'react-native';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { spacing } from '@presentation/base/theme';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';

export interface CreatorAvatarProps {
  name: string;
  photoUrl: string | null;
  platform: CreatorPlatformType;
  size: number;
  markSize: number;
  /** What the avatar sits on; the mark is cut out of it with a ring of this colour. */
  groundColor: string;
}

/** A creator's avatar with their platform mark tucked into the bottom-right corner. */
export const CreatorAvatar = ({ name, photoUrl, platform, size, markSize, groundColor }: CreatorAvatarProps): React.JSX.Element => (
  <View style={{ width: size, height: size }}>
    <AvatarImage uri={photoUrl ?? undefined} name={name} size={size} />
    <View style={styles.mark}>
      <CreatorPlatformMark platform={platform} size={markSize} ringColor={groundColor} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
    right: -spacing.xxs,
    bottom: -spacing.xxs,
    zIndex: ValueConstants.one,
  },
});
