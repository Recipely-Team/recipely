import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface StatsButtonProps {
  onPress: () => void;
}

/**
 * The way into Creator stats from the Automations bar (creator stats spec
 * "Entry points"): an icon on a narrow window, an outlined "Stats" pill when expanded.
 */
export const StatsButton = ({ onPress }: StatsButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isExpanded } = useLayout();
  const copy = t().creatorStats;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.title}
      style={({ pressed }) => [
        isExpanded ? [styles.pill, { borderColor: colors.cardBorder }] : styles.icon,
        { opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <Ionicons name="bar-chart-outline" size={isExpanded ? iconSizes.sm : iconSizes.lg} color={colors.text} />
      {isExpanded ? (
        <SizedText size={fontSizes.caption} weight={fontWeights.bold}>
          {copy.statsButton}
        </SizedText>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  icon: { width: controlSizes.touchTarget, height: controlSizes.touchTarget, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
});
