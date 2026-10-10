import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { borderWidths, fontSizes, fontWeights, fridgeSizes, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface MissingChipsProps {
  missing: readonly string[];
}

/**
 * What an idea still needs, as warning-tinted chips after a "Missing" label —
 * or, with nothing missing, the diary's green "on track" pill saying so.
 */
export const MissingChips = ({ missing }: MissingChipsProps): React.JSX.Element => {
  const warning = useSeveritySurfaces().warning;
  const on = useDiaryTones().on;
  const copy = t().fridge;

  if (missing.length === ValueConstants.zero) {
    return (
      <View style={[styles.pill, styles.everything, { backgroundColor: on.bg }]}>
        <Ionicons name="checkmark-circle" size={iconSizes.sm} color={on.fg} />
        <SizedText size={fontSizes.small} weight={fontWeights.bold} color={on.fg}>
          {copy.haveEverything}
        </SizedText>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <SizedText size={fontSizes.small} weight={fontWeights.bold} muted>
        {copy.missing}
      </SizedText>
      {missing.map((item) => (
        <View key={item} style={[styles.pill, { backgroundColor: warning.bg, borderColor: warning.border }]}>
          <SizedText size={fontSizes.small} weight={fontWeights.semibold} color={warning.text}>
            {item}
          </SizedText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs2,
  },
  pill: {
    minHeight: fridgeSizes.missingChip,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm2,
    justifyContent: 'center',
  },
  everything: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
