import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface StartBlankButtonProps {
  onPress: () => void;
}

/** The prompt phase's way out of AI altogether: an "or" rule, then an empty form. */
export const StartBlankButton = ({ onPress }: StartBlankButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {t().createRecipe.or}
        </ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <Pressable
        onPress={onPress}
        style={[styles.blankBtn, { borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={t().createRecipe.startBlank}
      >
        <ThemedText variant="body" style={[styles.blankLabel, { color: colors.text }]}>
          {t().createRecipe.startBlank}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: ValueConstants.one,
    height: StyleSheet.hairlineWidth,
  },
  blankBtn: {
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.medium,
  },
});
