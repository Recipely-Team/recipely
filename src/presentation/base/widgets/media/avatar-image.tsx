import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontWeights } from '@presentation/base/theme';
import { CharConstants, ValueConstants } from '@core/constants';

export interface AvatarImageProps {
  uri?: string;
  name: string;
  size: number;
}

const initialsFor = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === ValueConstants.zero) return '?';
  const parts = trimmed.split(/\s+/);
  const first = parts[ValueConstants.zero]?.[ValueConstants.zero] ?? CharConstants.empty;
  const second = parts.length > 1 ? (parts[parts.length - ValueConstants.one]?.[ValueConstants.zero] ?? CharConstants.empty) : CharConstants.empty;
  return (first + second).toUpperCase();
};

/** Circular avatar that shows a remote image or falls back to initials on a primary-gradient background. */
export const AvatarImage = ({ uri, name, size }: AvatarImageProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const borderRadius = size / 2;

  if (uri !== undefined && uri.length > ValueConstants.zero) {
    return (
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius }} />
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
        <Text style={[styles.initials, { fontSize: size * 0.36, color: colors.primaryText }]}>
          {initialsFor(name)}
        </Text>
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
