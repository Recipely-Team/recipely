import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface ShoppingListBarProps {
  onBack: () => void;
}

/**
 * The screen's top bar: back and the title. In the web shell the site header
 * is already above it, so the bar drops the safe-area inset and its hairline.
 */
export const ShoppingListBar = ({ onBack }: ShoppingListBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: isWebShell ? spacing.lg : insets.top + spacing.xs, borderBottomColor: isWebShell ? colors.background : colors.border },
      ]}
    >
      <RoundIconButton icon="chevron-back" accessibilityLabel={t().common.back} onPress={onBack} size={controlSizes.touchTarget} />
      <SizedText
        accessibilityRole="header"
        size={isWebShell ? fontSizes.title : fontSizes.heading}
        weight={fontWeights.heavy}
        numberOfLines={ValueConstants.one}
        style={styles.title}
      >
        {t().shopping.title}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  title: { flex: ValueConstants.one, minWidth: ValueConstants.zero },
});
