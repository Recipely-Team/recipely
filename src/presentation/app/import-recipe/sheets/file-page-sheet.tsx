import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { spacing, radii, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { COUNT_TOKEN, MAX_TOKEN } from '@presentation/app/import-recipe/model/file/count-token';
import type { FilePage } from '@presentation/app/import-recipe/model/file/file-page';
import { FilePageThumb } from '@presentation/app/import-recipe/items/file-page-thumb';

export interface FilePageSheetProps {
  pages: readonly FilePage[];
  /** The page being looked at, or null when the sheet is closed. */
  index: number | null;
  isPdf: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
}

/** The preview's height in the design; a page is a shape, so its box is pinned. */
const PREVIEW_HEIGHT = 260;

/**
 * One page, large: move it earlier or later in the reading order, or take it out.
 *
 * This is how the order is changed everywhere, the web included — the design's
 * web grid is reordered by dragging, which react-native-web does not offer.
 */
export const FilePageSheet = ({ pages, index, isPdf, onMove, onRemove, onClose }: FilePageSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const danger = useSeveritySurfaces().danger;
  const copy = t().fileImport;
  const page = index === null ? undefined : pages[index];
  const at = index ?? ValueConstants.zero;
  const title =
    page === undefined ? copy.pdfLabel : isPdf ? page.file.fileName : copy.page.replace(COUNT_TOKEN, String(at + 1));
  const moves = [
    { label: copy.moveEarlier, icon: 'chevron-back', to: at - ValueConstants.one },
    { label: copy.moveLater, icon: 'chevron-forward', to: at + ValueConstants.one },
  ] as const;

  return (
    <BottomSheet visible={page !== undefined} title={title} onClose={onClose}>
      {page === undefined ? null : (
        <View style={styles.body}>
          {isPdf ? null : (
            <ThemedText variant="caption" style={{ color: colors.textMuted }}>
              {copy.pageCount.replace(COUNT_TOKEN, String(at + 1)).replace(MAX_TOKEN, String(pages.length))}
            </ThemedText>
          )}
          <View style={[styles.preview, { borderColor: colors.cardBorder }]}>
            <FilePageThumb file={page.file} large />
          </View>
          {!isPdf && pages.length > ValueConstants.one ? (
            <View style={styles.moves}>
              {moves.map((move) => {
                const off = move.to < ValueConstants.zero || move.to >= pages.length;
                return (
                  <Pressable
                    key={move.label}
                    disabled={off}
                    onPress={() => onMove(at, move.to)}
                    accessibilityRole="button"
                    accessibilityLabel={move.label}
                    accessibilityState={{ disabled: off }}
                    style={[styles.move, { borderColor: colors.border, opacity: off ? opacities.inactive : opacities.full }]}
                  >
                    <Ionicons name={move.icon} size={iconSizes.md} color={colors.text} />
                    <ThemedText variant="body" style={styles.moveLabel}>
                      {move.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Pressable
            onPress={() => onRemove(at)}
            accessibilityRole="button"
            accessibilityLabel={copy.remove}
            style={[styles.remove, { backgroundColor: danger.bg }]}
          >
            <Ionicons name="trash-outline" size={iconSizes.md} color={danger.text} />
            <ThemedText variant="body" style={[styles.moveLabel, { color: danger.text }]}>
              {copy.remove}
            </ThemedText>
          </Pressable>
          <PrimaryButton label={copy.done} onPress={onClose} />
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm2,
  },
  preview: {
    height: PREVIEW_HEIGHT,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  moves: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  move: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.inputSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  moveLabel: {
    fontWeight: fontWeights.semibold,
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.inputSm,
    borderRadius: radii.lg,
  },
});
