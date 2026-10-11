import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { FridgePhoto } from '@domain/fridge/scan/fridge-photo';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { aspectRatios, borderWidths, controlSizes, fontSizes, fontWeights, fridgeSizes, iconSizes, layoutSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ScanSweep } from '@presentation/app/fridge/items/capture/scan-sweep';
import { useScanPhotoCue } from '@presentation/app/fridge/hooks/use-scan-photo-cue';
import { ValueConstants } from '@core/constants';

export interface AnalysingStepProps {
  photos: readonly FridgePhoto[];
}

const TILE_HEIGHT = fridgeSizes.analysingTile / aspectRatios.pagePortrait;

/**
 * The scan in flight: the photos in a row (at most 110 wide), the one being
 * "read" ringed in `primary` under a sweeping band, "Photo i of n" announced
 * politely, and a progress bar that fills with the cue.
 */
export const AnalysingStep = ({ photos }: AnalysingStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const current = useScanPhotoCue(photos.length);
  const total = Math.max(ValueConstants.one, photos.length);
  const share = (current + ValueConstants.one) / total;

  return (
    <View style={styles.root}>
      <View style={styles.tiles}>
        {photos.map((photo, index) => {
          const active = index === current;
          return (
            <View
              key={photo.uri}
              style={[styles.tile, { borderColor: active ? colors.primary : colors.cardBorder, backgroundColor: colors.skeleton }, active ? styles.tileActive : null]}
            >
              <RecipeImage uri={photo.uri} style={styles.image} placeholderCompact />
              {active ? <ScanSweep height={TILE_HEIGHT} /> : null}
            </View>
          );
        })}
      </View>
      <View style={styles.titleRow}>
        <Ionicons name="scan" size={iconSizes.xl} color={colors.primary} />
        <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
          {t().fridge.analysingTitle}
        </SizedText>
      </View>
      <SizedText accessibilityLiveRegion="polite" size={fontSizes.caption} muted>
        {t().fridge.analysingProgress.replace('{i}', String(current + ValueConstants.one)).replace('{n}', String(total))}
      </SizedText>
      <View style={[styles.track, { backgroundColor: colors.skeleton }]}>
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.zero }}
          style={[styles.fill, { width: `${share * ValueConstants.percent}%` }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  tiles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tile: {
    flex: ValueConstants.one,
    maxWidth: fridgeSizes.analysingTile,
    aspectRatio: aspectRatios.pagePortrait,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  tileActive: {
    borderWidth: borderWidths.medium,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    width: '100%',
    maxWidth: layoutSizes.maxContentSm,
    height: controlSizes.progressBar,
    borderRadius: radii.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.round,
  },
});
