import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { fontSizes, iconSizes, lineHeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { NutritionFacts } from '@domain/recipes/nutrition/nutrition-facts';
import { NutritionBasis, type NutritionBasisType } from '@domain/recipes/nutrition/nutrition-basis';
import { ValueConstants } from '@core/constants';
import { NutritionBasisSwitch } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-basis-switch';
import { CalorieSummary } from '@presentation/app/recipes/[recipeId]/items/nutrition/calorie-summary';
import { MacroTile } from '@presentation/app/recipes/[recipeId]/items/nutrition/macro-tile';
import { pairUp } from '@presentation/app/recipes/[recipeId]/model/nutrition/pair-up';

export interface NutritionPanelProps {
  facts: NutritionFacts;
  /** The backend is still computing; the empty state says so instead of "none". */
  isCalculating: boolean;
  /** The web sidebar's tighter ring, gaps and tile padding. */
  compact?: boolean;
}

/**
 * The nutrition section's body — basis switch, calorie ring, macro grid — with
 * no heading of its own: the screen that places it owns the one heading.
 *
 * @remarks
 * - **One heading per section.** The mobile card used to print its own title
 *   under the screen's section header, so "Besin değerleri" read twice.
 * - **"None" and "not yet" are different sentences.** A recipe opened moments
 *   after saving may not have figures yet; saying it has none would be a claim
 *   about the recipe when the truth is about the clock.
 * - **Per 100 g by default, when it can be.** Without a serving weight the
 *   switch is withheld and a note says why, rather than offering a basis the
 *   domain would silently ignore.
 */
export const NutritionPanel = ({ facts, isCalculating, compact = false }: NutritionPanelProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().nutrition;
  const noteLineHeight = useTextLineHeight(fontSizes.small, lineHeights.normal);
  const [requested, setRequested] = useState<NutritionBasisType>(NutritionBasis.Per100g);

  if (!facts.hasAny) {
    return (
      <ThemedText variant="caption" muted>
        {isCalculating ? strings.calculating : strings.unavailable}
      </ThemedText>
    );
  }

  const reading = facts.read(requested);
  const weight = reading.servingWeightGrams;

  return (
    <View style={[styles.stack, compact ? styles.stackCompact : null]}>
      {weight === undefined ? null : (
        <NutritionBasisSwitch weightGrams={weight} basis={reading.basis} onChange={setRequested} />
      )}
      <CalorieSummary reading={reading} compact={compact} />
      {reading.macros.length === ValueConstants.zero ? null : (
        <View style={[styles.grid, compact ? styles.gridCompact : null]}>
          {pairUp(reading.macros).map((row) => (
            <View key={row.map((macro) => macro.macro).join()} style={[styles.gridRow, compact ? styles.gridCompact : null]}>
              {row.map((macro) => (
                <MacroTile key={macro.macro} reading={macro} compact={compact} />
              ))}
              {row.length < ValueConstants.two ? <View style={styles.spacer} /> : null}
            </View>
          ))}
        </View>
      )}
      {weight === undefined ? (
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textMuted} style={styles.noteIcon} />
          <ThemedText muted style={[styles.noteText, { lineHeight: noteLineHeight }]}>
            {strings.noWeight}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  stackCompact: { gap: spacing.md },
  grid: { gap: spacing.md },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  gridCompact: { gap: spacing.sm2 },
  spacer: { flex: ValueConstants.one },
  note: { flexDirection: 'row', gap: spacing.sm },
  noteIcon: { marginTop: spacing.xxs },
  noteText: { flex: ValueConstants.one, fontSize: fontSizes.small },
});
