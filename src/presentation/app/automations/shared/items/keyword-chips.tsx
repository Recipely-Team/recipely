import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface KeywordChipsProps {
  keywords: readonly string[];
  /** Shows this many, then "+n"; null shows all. */
  limit: number | null;
}

const MORE = '+';

/** A rule's keywords as read-only chips (spec: h24, 12/600), cut to `limit` with "+n". */
export const KeywordChips = ({ keywords, limit }: KeywordChipsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const shown = limit === null ? keywords : keywords.slice(ValueConstants.zero, limit);
  const rest = keywords.length - shown.length;
  const chip = (label: string): React.JSX.Element => (
    <View key={label} style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
      <SizedText size={fontSizes.small} weight={fontWeights.semibold} color={colors.chipText} numberOfLines={ValueConstants.one}>
        {label}
      </SizedText>
    </View>
  );
  return (
    <View style={styles.row}>
      {shown.map(chip)}
      {rest > ValueConstants.zero ? chip(`${MORE}${rest}`) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: AutomationMetrics.keywordChip, paddingHorizontal: spacing.sm, borderRadius: radii.round, justifyContent: 'center' },
});
