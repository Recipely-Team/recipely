import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, lineHeights, opacities, radii, shadows, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';

export interface CreatorApplyCardProps {
  onApply: () => void;
}

/** "Are you a food creator?" with a primary "Apply as a creator" — the Chefs placeholder's one action. */
export const CreatorApplyCard = ({ onApply }: CreatorApplyCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().creators.comingSoon;
  return (
    <View style={[styles.card, shadows.md, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <SizedText size={fontSizes.body} weight={fontWeights.bold} ratio={lineHeights.normal}>
        {strings.creatorQuestion}
      </SizedText>
      <Pressable
        onPress={onApply}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
      >
        <MaterialCommunityIcons name="chef-hat" size={iconSizes.lg} color={colors.primaryText} />
        <SizedText size={fontSizes.body} weight={fontWeights.bold} color={colors.primaryText}>
          {strings.apply}
        </SizedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
});
