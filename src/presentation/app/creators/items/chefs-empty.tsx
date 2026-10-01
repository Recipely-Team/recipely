import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { avatarSizes, borderWidths, fontSizes, fontWeights, iconSizes, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';

/** "No chefs yet." under a 64 chef-hat disc, centred (design spec → Chefs tab §5, Empty). */
export const ChefsEmpty = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const size = avatarSizes.creatorCard;
  return (
    <View style={styles.empty}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.disc,
          { width: size, height: size, borderRadius: size / ValueConstants.two, backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <MaterialCommunityIcons name="chef-hat" size={iconSizes.xxl} color={colors.textSubtle} />
      </View>
      <SizedText size={fontSizes.body} weight={fontWeights.semibold} style={styles.text}>
        {t().creators.empty}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.hairline,
  },
  text: {
    textAlign: 'center',
  },
});
