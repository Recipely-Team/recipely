import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, borderWidths, avatarSizes, lineHeightFor, lineHeights } from '@presentation/base/theme';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { t } from '@presentation/i18n';
import type { ImportReview } from '@presentation/app/create-recipe/model/review/import-review';
import { CheckChip } from '@presentation/app/create-recipe/items/check-chip';
import { WhatWeReadSheet } from '@presentation/app/create-recipe/sheets/what-we-read-sheet';

export interface ImportReviewBlockProps {
  review: ImportReview;
  /** True while at least one guessed line is still on screen unedited. */
  showLegend: boolean;
}

/**
 * The top of an imported draft: the "we wrote this one" note when the post had
 * no recipe, the "What we read" row that opens the caption and transcript, and
 * the legend for the Check chips (prototype: Import Review board, §1).
 *
 * @remarks
 * - **The note is not a warning**: no warning colour, no dismiss. It says what
 *   happened and stays until the draft is saved.
 * - **Nothing renders when there is nothing to say**, so an ordinary import
 *   with every line read looks exactly as before.
 */
export const ImportReviewBlock = ({ review, showLegend }: ImportReviewBlockProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const copy = t().createRecipe.importReview;
  const [reading, setReading] = useState(false);
  const hasSource = review.sourceText !== undefined;
  if (!review.suggested && !hasSource && !showLegend) return null;

  return (
    <View style={styles.block}>
      {review.suggested ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} accessibilityRole="text">
          <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="sparkles" size={iconSizes.sm} color={colors.primary} />
          </View>
          <ThemedText style={[styles.noteText, { color: colors.text }]}>{copy.suggested}</ThemedText>
        </View>
      ) : null}
      {hasSource ? (
        <Pressable
          onPress={() => setReading(true)}
          style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          accessibilityRole="button"
          accessibilityLabel={copy.readTitle}
          accessibilityHint={copy.readSub}
        >
          {review.sourcePlatform !== null ? (
            <ProvenanceSeal marks={[review.sourcePlatform]} surface={SealSurface.Page} size={avatarSizes.noteDisc} decorative />
          ) : null}
          <View style={styles.rowText}>
            <ThemedText style={[styles.rowTitle, { color: colors.text }]}>{copy.readTitle}</ThemedText>
            <ThemedText variant="caption" muted>{copy.readSub}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textMuted} />
        </Pressable>
      ) : null}
      {showLegend ? (
        <View style={styles.legend}>
          <CheckChip decorative />
          <ThemedText variant="caption" muted style={styles.legendText}>{copy.legend}</ThemedText>
        </View>
      ) : null}
      {hasSource ? <WhatWeReadSheet visible={reading} review={review} onClose={() => setReading(false)} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  row: { alignItems: 'center' },
  disc: {
    width: avatarSizes.noteDisc,
    height: avatarSizes.noteDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: { flex: 1, fontSize: fontSizes.body, lineHeight: lineHeightFor(fontSizes.body, lineHeights.relaxed) },
  rowText: { flex: 1, gap: spacing.xxs },
  rowTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendText: { flex: 1 },
});
