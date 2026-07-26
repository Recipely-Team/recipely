import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, controlSizes, borderWidths } from '@presentation/base/theme';
import { DIFFICULTY_VALUES, type Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface DifficultyToggleProps {
  value: Difficulty;
  label: (difficulty: Difficulty) => string;
  onChange: (difficulty: Difficulty) => void;
}

/** Segmented Easy / Medium / Hard control sized to its content. */
export const DifficultyToggle = ({
  value,
  label,
  onChange,
}: DifficultyToggleProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.root, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {DIFFICULTY_VALUES.map((option, index) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityLabel={label(option)}
            style={[
              styles.segment,
              {
                borderLeftWidth: index > ValueConstants.zero ? ValueConstants.one : ValueConstants.zero,
                borderLeftColor: colors.border,
                backgroundColor: active ? colors.primary : 'transparent',
              },
            ]}
          >
            <ThemedText
              style={[
                styles.label,
                { color: active ? colors.primaryText : colors.textMuted },
              ]}
            >
              {label(option)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
});
