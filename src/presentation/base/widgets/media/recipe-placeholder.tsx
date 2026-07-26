import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

const WASH_OPACITY = opacities.scrimSubtle;
const TEXTURE_OPACITY = opacities.disabledFaint;
const MOTIF_OPACITY = opacities.onMediaFaint;
const LABEL_OPACITY = opacities.pressedSubtle;
const LABEL_TRACKING = letterSpacings.subtle;
const TEXTURE_GAP = 12;
const FULL_LOGO_SIZE = 52;
const COMPACT_LOGO_SIZE = 30;

export interface RecipePlaceholderProps {
  /** Caption under the motif (e.g. "No photo yet"). Hidden when `compact`. */
  label?: string;
  /** Smaller motif and no caption — for dense thumbnails / grids. */
  compact?: boolean;
  /** Overrides the motif logo size. */
  logoSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Brand-tinted fallback shown when a recipe has no photo. Layers a soft brand
 * gradient wash and a diagonal hairline texture under the monochrome Recipely
 * chef-hat motif so empty media reads as intentional rather than broken.
 * Fills its parent — drop it into any relatively-positioned image container.
 */
export const RecipePlaceholder = ({
  label,
  compact = false,
  logoSize,
  style,
}: RecipePlaceholderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const size = logoSize ?? (compact ? COMPACT_LOGO_SIZE : FULL_LOGO_SIZE);

  return (
    <View style={[styles.root, { backgroundColor: colors.skeleton }, style]}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.one }}
        style={[StyleSheet.absoluteFill, styles.wash]}
      />
      <Svg style={[StyleSheet.absoluteFill, styles.texture]} width="100%" height="100%">
        <Defs>
          <Pattern
            id="rcpDiag"
            width={TEXTURE_GAP}
            height={TEXTURE_GAP}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Line x1={ValueConstants.zero} y1={ValueConstants.zero} x2={ValueConstants.zero} y2={TEXTURE_GAP} stroke={colors.cardBorder} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#rcpDiag)" />
      </Svg>
      <View style={[styles.motif, { gap: compact ? ValueConstants.zero : spacing.xs }]}>
        <RecipelyLogo size={size} monochrome mono={colors.primary} />
        {!compact && label ? (
          <ThemedText variant="caption" style={[styles.label, { color: colors.primary }]}>
            {label}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    opacity: WASH_OPACITY,
  },
  texture: {
    opacity: TEXTURE_OPACITY,
  },
  motif: {
    alignItems: 'center',
    opacity: MOTIF_OPACITY,
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
    letterSpacing: LABEL_TRACKING,
    opacity: LABEL_OPACITY,
  },
});
