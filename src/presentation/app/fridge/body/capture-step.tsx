import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Failure } from '@core/failure';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import type { FridgePhoto } from '@domain/fridge/scan/fridge-photo';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, fridgeSizes, iconSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { PhotoTile } from '@presentation/app/fridge/items/capture/photo-tile';
import { AddPhotoTile } from '@presentation/app/fridge/items/capture/add-photo-tile';
import { FridgePrimaryButton } from '@presentation/app/fridge/items/buttons/fridge-primary-button';
import { GhostButton } from '@presentation/app/fridge/items/buttons/ghost-button';
import { fridgeFailureMessage } from '@presentation/app/fridge/model/flow/fridge-failure-message';
import { ValueConstants } from '@core/constants';

export interface CaptureStepProps {
  photos: readonly FridgePhoto[];
  failure: Failure | null;
  /** False where there is no camera to open (the web shell's file picker covers both). */
  canUseCamera: boolean;
  onTakePhoto: () => void;
  onChoosePhotos: () => void;
  onRemovePhoto: (index: number) => void;
}

/**
 * Step 1: up to three photos. Empty, a dashed zone with both sources; with
 * photos, a three-column 3:4 grid whose empty slots add more. A failed scan
 * comes back here with a danger banner and the photos kept.
 */
export const CaptureStep = ({ photos, failure, canUseCamera, onTakePhoto, onChoosePhotos, onRemovePhoto }: CaptureStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const room = FridgeLimits.photosMax - photos.length;
  const sources = (compact: boolean) => (
    <View style={styles.row}>
      {canUseCamera ? (
        compact ? <GhostButton compact grow icon="camera-outline" label={copy.takePhoto} onPress={onTakePhoto} /> : <FridgePrimaryButton grow icon="camera" label={copy.takePhoto} onPress={onTakePhoto} />
      ) : null}
      <GhostButton compact={compact} grow icon="images-outline" label={copy.choosePhotos} onPress={onChoosePhotos} />
    </View>
  );

  return (
    <View style={styles.root}>
      {failure === null ? null : <FormBanner severity="danger" message={fridgeFailureMessage(failure)} />}
      <View style={styles.heading}>
        <SizedText accessibilityRole="header" size={fontSizes.display} weight={fontWeights.heavy} ratio={lineHeights.tight}>
          {copy.captureTitle}
        </SizedText>
        <SizedText size={fontSizes.medium} ratio={lineHeights.normal} muted>
          {copy.captureSub}
        </SizedText>
      </View>

      {photos.length === ValueConstants.zero ? (
        <View style={[styles.zone, { borderColor: colors.border }]}>
          <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="camera" size={iconSizes.xxxl} color={colors.primary} />
          </View>
          <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
            {copy.upToThree}
          </SizedText>
          {sources(false)}
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <PhotoTile key={photo.uri} uri={photo.uri} position={index + ValueConstants.one} onRemove={() => onRemovePhoto(index)} />
            ))}
            {Array.from({ length: room }, (_, slot) => (
              <AddPhotoTile key={`slot-${slot}`} onPress={onChoosePhotos} />
            ))}
          </View>
          {room > ValueConstants.zero ? sources(true) : null}
        </>
      )}

      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={iconSizes.md} color={colors.textMuted} />
        <SizedText size={fontSizes.caption} ratio={lineHeights.normal} muted style={styles.tipText}>
          {copy.tip}
        </SizedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  heading: {
    gap: spacing.xs,
  },
  zone: {
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  disc: {
    width: fridgeSizes.cameraDisc,
    height: fridgeSizes.cameraDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    flex: ValueConstants.one,
  },
});
