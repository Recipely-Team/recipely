import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { RoundIconButtonTone } from '@presentation/base/widgets/buttons/round-icon-button-tone';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface CookTopBarProps {
  recipeName: string;
  onExit: () => void;
  onOpenIngredients: () => void;
  /** False until there is a recipe whose ingredients could be shown. */
  hasIngredients: boolean;
}

/** Cook mode's top row: exit, the recipe's name, and the ingredients button. */
export const CookTopBar = ({ recipeName, onExit, onOpenIngredients, hasIngredients }: CookTopBarProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.row}>
      <RoundIconButton
        icon="close"
        accessibilityLabel={t().cookMode.exit}
        onPress={onExit}
        size={controlSizes.pageCloseBtn}
        tone={RoundIconButtonTone.Outlined}
      />
      <ThemedText variant="subtitle" numberOfLines={ValueConstants.one} style={[styles.title, { color: colors.text }]}>
        {recipeName}
      </ThemedText>
      {hasIngredients ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenIngredients}
          style={({ pressed }) => [
            styles.pill,
            { borderColor: colors.cardBorder, backgroundColor: colors.surface, opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <Ionicons name="list-outline" size={iconSizes.md} color={colors.text} />
          <ThemedText variant="label" style={[styles.pillLabel, { color: colors.text }]}>
            {t().cookMode.ingredients}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flex: ValueConstants.one,
    fontWeight: fontWeights.bold,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.pageCloseBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  pillLabel: {
    fontWeight: fontWeights.semibold,
  },
});
