import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontWeights, durations } from '@presentation/base/theme';
import { AVATAR_INITIALS_FONT_RATIO } from '@presentation/base/widgets/media/avatar-initials-font-ratio';
import { CharConstants, ValueConstants } from '@core/constants';

export interface AvatarImageProps {
  uri?: string;
  /** Empty for nobody in particular — a signed-out visitor — which draws the person mark. */
  name: string;
  size: number;
}

/** The icon's share of the circle, so the mark keeps its proportions at every size. */
const PERSON_ICON_RATIO = 0.55;

const initialsFor = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === ValueConstants.zero) return '?';
  const parts = trimmed.split(/\s+/);
  const first = parts[ValueConstants.zero]?.[ValueConstants.zero] ?? CharConstants.empty;
  const second = parts.length > ValueConstants.one ? (parts[parts.length - ValueConstants.one]?.[ValueConstants.zero] ?? CharConstants.empty) : CharConstants.empty;
  return (first + second).toUpperCase();
};

/**
 * Circular avatar: a photo, else the person's initials, else the person mark.
 *
 * @remarks
 * - **No name, no initials.** Signed out, the header used to build initials
 *   from a placeholder display name and show "RU" — which reads as an account
 *   that is signed in. Nobody's avatar is a generic mark, not somebody's
 *   letters.
 */
export const AvatarImage = ({ uri, name, size }: AvatarImageProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const borderRadius = size / ValueConstants.two;

  if (uri !== undefined && uri.length > ValueConstants.zero) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        // Avatars repeat across every comment and every card in a list, so the
        // same handful of photos was being fetched dozens of times per screen.
        cachePolicy="memory-disk"
        transition={durations.imageFade}
        recyclingKey={uri}
      />
    );
  }

  // Fallback uses the primary gradient so the avatar always lifts off the
  // theme's pale light backgrounds (e.g. Crimson Ember bg ≈ primaryLight).
  return (
    <LinearGradient
      colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
      start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
      end={{ x: ValueConstants.one, y: ValueConstants.one }}
      style={[styles.fallback, { width: size, height: size, borderRadius }]}
    >
      <View style={styles.innerOverlay}>
        {name.trim().length === ValueConstants.zero ? (
          <Ionicons name="person" size={size * PERSON_ICON_RATIO} color={colors.primaryText} />
        ) : (
          <Text
            style={[
              styles.initials,
              { fontSize: size * AVATAR_INITIALS_FONT_RATIO, color: colors.primaryText },
            ]}
          >
            {initialsFor(name)}
          </Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: fontWeights.bold,
  },
});
