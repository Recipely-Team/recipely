import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImportFileLimits } from '@domain/recipes/import-file/import-file-limits';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, radii, fontWeights, iconSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { isWeb } from '@infrastructure/constants/platform';
import { COUNT_TOKEN, MAX_TOKEN } from '@presentation/app/import-recipe/model/file/count-token';
import type { FilePage } from '@presentation/app/import-recipe/model/file/file-page';
import { FilePageTile } from '@presentation/app/import-recipe/items/file-page-tile';
import { FileAddTile } from '@presentation/app/import-recipe/items/file-add-tile';

export interface FilePageGridProps {
  pages: readonly FilePage[];
  isPdf: boolean;
  isFull: boolean;
  isDragging: boolean;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

/** Three pages to a row on a phone, five once the window is wide — as the design lays them out. */
const PHONE_COLUMNS = 3;
const WIDE_COLUMNS = 5;

/**
 * The picked pages in reading order, with a tile to add one more.
 *
 * @remarks
 * - **Sized from the measured width**, so a row of three or five always fills
 *   the column exactly; percentage widths plus gaps overflow by a gap.
 * - **A PDF carries no page number and no reorder hint** — it is one document.
 */
export const FilePageGrid = ({
  pages,
  isPdf,
  isFull,
  isDragging,
  onSelect,
  onRemove,
  onAdd,
}: FilePageGridProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isExpanded } = useLayout();
  const copy = t().fileImport;
  const [width, setWidth] = useState(ValueConstants.zero);
  const columns = isExpanded ? WIDE_COLUMNS : PHONE_COLUMNS;
  const gap = isExpanded ? spacing.md : spacing.sm2;
  const tileWidth = width > ValueConstants.zero ? (width - gap * (columns - ValueConstants.one)) / columns : ValueConstants.zero;
  const count = isPdf
    ? copy.pdfLabel
    : copy.pageCount.replace(COUNT_TOKEN, String(pages.length)).replace(MAX_TOKEN, String(ImportFileLimits.maxImages));

  return (
    <View>
      <View style={styles.header}>
        <ThemedText variant="label" style={{ color: colors.textMuted }}>
          {copy.pages}
        </ThemedText>
        <ThemedText variant="caption" style={[styles.count, { color: colors.textMuted }]}>
          {count}
        </ThemedText>
      </View>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.grid,
          { gap },
          isDragging ? [styles.dropping, { borderColor: colors.primary, backgroundColor: colors.chipBackground }] : null,
        ]}
      >
        {tileWidth > ValueConstants.zero
          ? pages.map((page, index) => (
              <FilePageTile
                key={page.key}
                file={page.file}
                index={index}
                width={tileWidth}
                showNumber={!isPdf}
                onPress={() => onSelect(index)}
                onRemove={() => onRemove(index)}
              />
            ))
          : null}
        {tileWidth > ValueConstants.zero && !isFull ? <FileAddTile width={tileWidth} onPress={onAdd} /> : null}
      </View>
      {!isPdf && pages.length > ValueConstants.one ? (
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} />
          <ThemedText variant="caption" style={[styles.hintText, { color: colors.textMuted }]}>
            {copy.order}
          </ThemedText>
        </View>
      ) : null}
      {isWeb() && !isFull ? (
        <ThemedText variant="caption" style={[styles.webHint, { color: colors.textMuted }]}>
          {copy.drop} · {copy.formats}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm2,
  },
  count: {
    fontWeight: fontWeights.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: radii.md,
  },
  dropping: {
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    marginTop: spacing.md,
  },
  hintText: {
    flex: ValueConstants.one,
  },
  webHint: {
    marginTop: spacing.sm,
  },
});
