import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import { InstagramMediaType } from '@domain/instagram/instagram-media-type';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { BrandColors, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PostTileProps {
  media: InstagramMedia;
  selected: boolean;
  /** Another automation already watches it (allowed). */
  hasRule: boolean;
  onPress: (media: InstagramMedia) => void;
}

/** A square post or Reel cover in the post picker (spec step 1): selected ring and check, Reel badge, "Has rule" tag. */
export const PostTile = ({ media, selected, hasRule, onPress }: PostTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const isReel = media.mediaType === InstagramMediaType.Video;
  return (
    <Pressable
      onPress={() => onPress(media)}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={media.caption ?? (isReel ? t().instagram.reel : t().instagram.stepPost)}
      style={styles.tile}
    >
      <RecipeImage uri={media.thumbnailUrl} placeholderCompact style={StyleSheet.absoluteFill} />
      {selected ? <View style={[StyleSheet.absoluteFill, styles.ring, { borderColor: colors.primary }]} /> : null}
      {selected ? (
        <View style={[styles.check, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primaryText} />
        </View>
      ) : null}
      {isReel ? (
        <View style={[styles.reel, { backgroundColor: colors.scrim }]}>
          <Ionicons name="play" size={iconSizes.xxs} color={BrandColors.white} />
        </View>
      ) : null}
      {hasRule ? (
        <View style={[styles.tag, { backgroundColor: colors.chipBackground }]}>
          <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.chipText} numberOfLines={ValueConstants.one}>
            {t().instagram.hasRule}
          </SizedText>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: { flex: ValueConstants.one, aspectRatio: ValueConstants.one, borderRadius: radii.lg, overflow: 'hidden' },
  ring: { borderWidth: AutomationMetrics.postSelectedRing, borderRadius: radii.lg },
  check: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: AutomationMetrics.postCheck,
    height: AutomationMetrics.postCheck,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reel: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: AutomationMetrics.reelBadge,
    height: AutomationMetrics.reelBadge,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: { position: 'absolute', bottom: spacing.xs, left: spacing.xs, paddingHorizontal: spacing.xs, borderRadius: radii.sm },
});
