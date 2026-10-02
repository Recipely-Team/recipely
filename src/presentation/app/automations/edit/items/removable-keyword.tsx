import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface RemovableKeywordProps {
  word: string;
  onRemove: (word: string) => void;
}

/** A keyword in the editor (spec: h32 chip with a 28 × button inside). */
export const RemovableKeyword = ({ word, onRemove }: RemovableKeywordProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
      <SizedText size={fontSizes.medium} weight={fontWeights.semibold} color={colors.chipText}>
        {word}
      </SizedText>
      <Pressable
        onPress={() => onRemove(word)}
        accessibilityRole="button"
        accessibilityLabel={t().instagram.removeKeyword.replace('{k}', word)}
        style={styles.remove}
        hitSlop={spacing.xs}
      >
        <Ionicons name="close" size={iconSizes.sm} color={colors.chipText} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: AutomationMetrics.keywordChipRemovable,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.round,
  },
  remove: { width: AutomationMetrics.keywordRemove, height: AutomationMetrics.keywordRemove, alignItems: 'center', justifyContent: 'center' },
});
