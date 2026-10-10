import { Pressable, StyleSheet } from 'react-native';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';

export interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** One single-select option (the diet row): selected is `chipBackground` with a `primary` outline and label. */
export const ChoiceChip = ({ label, selected, onPress }: ChoiceChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={[
        styles.chip,
        selected ? { backgroundColor: colors.chipBackground, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={selected ? colors.primary : colors.text}>
        {label}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: controlSizes.segmentOption,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
