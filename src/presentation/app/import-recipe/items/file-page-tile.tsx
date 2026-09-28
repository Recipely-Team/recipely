import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  iconSizes,
  borderWidths,
  aspectRatios,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { COUNT_TOKEN } from '@presentation/app/import-recipe/model/file/count-token';
import { FilePageThumb } from '@presentation/app/import-recipe/items/file-page-thumb';

export interface FilePageTileProps {
  file: ImportFile;
  /** 0-based place in the reading order. */
  index: number;
  width: number;
  /** A PDF is one document, so it carries no page number. */
  showNumber: boolean;
  onPress: () => void;
  onRemove: () => void;
}

/** The page number chip, as the design draws it. */
const NUMBER_CHIP = 22;
/** The remove control's touch target; the visible disc inside it is smaller. */
const REMOVE_TARGET = 44;
const REMOVE_DISC = 26;
/** How far the remove target reaches past the tile's corner. */
const REMOVE_OVERHANG = -6;

/**
 * One picked page in the grid: tap it to move or remove it, or take it out
 * with the corner button.
 */
export const FilePageTile = ({
  file,
  index,
  width,
  showNumber,
  onPress,
  onRemove,
}: FilePageTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fileImport;
  const label = copy.page.replace(COUNT_TOKEN, String(index + 1));

  return (
    <View style={{ width }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.thumb, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}
      >
        <FilePageThumb file={file} />
      </Pressable>
      {showNumber ? (
        <View pointerEvents="none" style={[styles.number, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.numberText, { color: colors.primaryText }]}>{index + 1}</ThemedText>
        </View>
      ) : null}
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={copy.remove}
        accessibilityHint={label}
        style={styles.removeTarget}
      >
        <View style={[styles.removeDisc, { backgroundColor: colors.text, borderColor: colors.background }]}>
          <Ionicons name="close" size={iconSizes.xs} color={colors.background} />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  thumb: {
    aspectRatio: aspectRatios.pagePortrait,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  number: {
    position: 'absolute',
    left: spacing.xs2,
    top: spacing.xs2,
    minWidth: NUMBER_CHIP,
    height: NUMBER_CHIP,
    paddingHorizontal: spacing.xs2,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.heavy,
  },
  removeTarget: {
    position: 'absolute',
    right: REMOVE_OVERHANG,
    top: REMOVE_OVERHANG,
    width: REMOVE_TARGET,
    height: REMOVE_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeDisc: {
    width: REMOVE_DISC,
    height: REMOVE_DISC,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
