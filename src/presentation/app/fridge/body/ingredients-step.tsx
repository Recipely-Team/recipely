import { StyleSheet, View } from 'react-native';
import type { Failure } from '@core/failure';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, iconSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { IngredientChip } from '@presentation/app/fridge/items/ingredients/ingredient-chip';
import { AddIngredientChip } from '@presentation/app/fridge/items/ingredients/add-ingredient-chip';
import { FiltersCard } from '@presentation/app/fridge/body/filters-card';
import type { FridgeChip } from '@presentation/app/fridge/model/flow/fridge-chip';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';
import { IngredientSource, type IngredientSourceType } from '@presentation/app/fridge/model/flow/ingredient-source';
import { fridgeFailureMessage } from '@presentation/app/fridge/model/flow/fridge-failure-message';

export interface IngredientsStepProps {
  chips: readonly FridgeChip[];
  source: IngredientSourceType;
  filters: FridgeFilters;
  failure: Failure | null;
  startAdding: boolean;
  /** Denser chips on an expanded layout. */
  dense: boolean;
  onRemoveChip: (chip: FridgeChip) => void;
  onAddChip: (name: string) => void;
  onChangeFilters: (filters: Partial<FridgeFilters>) => void;
}

/**
 * Step 2: the ingredient chips (a live count in the heading, dimmed ones the
 * scan was unsure of, "+ Add" to type more) and the optional filters.
 */
export const IngredientsStep = ({ chips, source, filters, failure, startAdding, dense, onRemoveChip, onAddChip, onChangeFilters }: IngredientsStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const scanned = source === IngredientSource.Scan;
  const anyUnsure = chips.some((chip) => !chip.sure);

  return (
    <View style={styles.root}>
      {failure === null ? null : <FormBanner severity="danger" message={fridgeFailureMessage(failure)} />}
      <View style={styles.heading}>
        <SizedText accessibilityRole="header" accessibilityLiveRegion="polite" size={fontSizes.display} weight={fontWeights.heavy} ratio={lineHeights.tight}>
          {scanned ? copy.foundTitle.replace('{n}', String(chips.length)) : copy.typedTitle}
        </SizedText>
        <SizedText size={fontSizes.medium} ratio={lineHeights.normal} muted>
          {scanned ? copy.foundSub : copy.typedSub}
        </SizedText>
      </View>
      <View style={styles.chips}>
        {chips.map((chip) => (
          <IngredientChip key={chip.key} chip={chip} dense={dense} onRemove={onRemoveChip} />
        ))}
        <AddIngredientChip startOpen={startAdding} dense={dense} onAdd={onAddChip} />
      </View>
      {anyUnsure ? (
        <View style={styles.legend}>
          <View style={[styles.legendSwatch, { borderColor: colors.border }]} />
          <SizedText size={fontSizes.caption} muted>
            {copy.notSureLegend}
          </SizedText>
        </View>
      ) : null}
      <FiltersCard filters={filters} onChange={onChangeFilters} />
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendSwatch: {
    width: iconSizes.md,
    height: iconSizes.sm,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
  },
});
