import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { t } from '@presentation/i18n';
import { UnitSystem, type UnitSystemType } from '@domain/recipes/ingredients/unit-system';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';

export interface UnitSystemToggleProps {
  portions: PortionScaling;
}

/** Original / Metric / US — which units the ingredient amounts read in. Reuses the diary's `SegmentedTabs`. */
export const UnitSystemToggle = ({ portions }: UnitSystemToggleProps): React.JSX.Element => {
  const strings = t().recipes.portions;
  const options: { key: UnitSystemType; label: string }[] = [
    { key: UnitSystem.Original, label: strings.original },
    { key: UnitSystem.Metric, label: strings.metric },
    { key: UnitSystem.Imperial, label: strings.imperial },
  ];
  return <SegmentedTabs options={options} value={portions.unitSystem} onChange={portions.onChangeUnitSystem} />;
};
