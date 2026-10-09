import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import { periodDelta } from '@domain/instagram/stats/period-delta';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface DeltaChipProps {
  current: number;
  previous: number;
  /** The range, for the spoken "Change vs previous N days". */
  days: number;
}

/**
 * The change against the previous period (spec "Delta chip"): up in success,
 * down in danger, 0% neutral without an arrow; hidden when the previous
 * period had nothing to compare with.
 */
export const DeltaChip = ({ current, previous, days }: DeltaChipProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const surfaces = useSeveritySurfaces();
  const delta = periodDelta(current, previous);
  if (delta === null) return null;
  const copy = t().creatorStats;
  const up = delta > ValueConstants.zero;
  const down = delta < ValueConstants.zero;
  const surface = up ? surfaces.success : down ? surfaces.danger : null;
  const percent = `${Math.abs(delta)}%`;
  const spoken = up ? copy.deltaUp.replace('{x}', String(Math.abs(delta))) : down ? copy.deltaDown.replace('{x}', String(Math.abs(delta))) : copy.deltaNone;
  return (
    <View
      accessible
      accessibilityLabel={`${spoken} · ${copy.vsPrev.replace('{n}', String(days))}`}
      style={[
        styles.chip,
        surface === null
          ? { backgroundColor: colors.surface, borderColor: colors.cardBorder }
          : { backgroundColor: surface.bg, borderColor: surface.border },
      ]}
    >
      {surface !== null ? <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={iconSizes.xs} color={surface.icon} /> : null}
      <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={surface?.text ?? colors.textSubtle}>
        {percent}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    minHeight: StatsMetrics.deltaChip,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs2,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});
