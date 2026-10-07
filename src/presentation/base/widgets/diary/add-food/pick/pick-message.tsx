import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, diarySizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';

export interface PickMessageProps {
  title: string;
  hint: string | null;
  /** The chip under the text: "Quick add" for no results, "Try again" after a failure. */
  action: { label: string; icon: 'flash' | 'refresh' | 'create-outline'; onPress: () => void } | null;
}

/** The pick step's no-results and failed faces: a search disc, a line, a hint and one chip (Add food v2 spec §4). */
export const PickMessage = ({ title, hint, action }: PickMessageProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.box}>
      <View style={[styles.circle, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={iconSizes.xl} color={colors.textMuted} />
      </View>
      <SizedText size={fontSizes.body} weight={fontWeights.bold} style={styles.center}>
        {title}
      </SizedText>
      {hint === null ? null : (
        <SizedText size={fontSizes.caption} muted style={styles.center}>
          {hint}
        </SizedText>
      )}
      {action === null ? null : (
        <Pressable onPress={action.onPress} accessibilityRole="button" style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
          <Ionicons name={action.icon} size={iconSizes.sm} color={colors.chipText} />
          <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.chipText}>
            {action.label}
          </SizedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: { minHeight: diarySizes.pickBodyMinHeight, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  circle: {
    width: diarySizes.pickMessageCircle,
    height: diarySizes.pickMessageCircle,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    marginTop: spacing.xs,
  },
});
