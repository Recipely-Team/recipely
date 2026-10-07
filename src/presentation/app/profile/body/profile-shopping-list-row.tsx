import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { RoutePaths } from '@presentation/base/constants';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** Profile's way into the shopping list — on every platform, the web shell included. */
export const ProfileShoppingListRow = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const router = useRouter();
  const copy = t().shopping;
  return (
    <Pressable
      onPress={() => router.push(RoutePaths.shoppingList)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="cart-outline" size={iconSizes.md} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
          {copy.entry}
        </SizedText>
        <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
          {copy.entrySub}
        </SizedText>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: controlSizes.searchBar + spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  icon: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
});
