import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';

export interface ShoppingListBarProps {
  onBack: () => void;
  /** Shares the list as a checklist; null hides the button (nothing on the list). */
  onShare: (() => void) | null;
}

/**
 * The screen's top bar: back and the title. In the web shell the site header
 * is already above it, so the bar drops the safe-area inset and its hairline.
 * Share sits at the trailing end, the same round button the recipe page uses.
 */
export const ShoppingListBar = ({ onBack, onShare }: ShoppingListBarProps): React.JSX.Element => {
  const t = useTranslations();
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
      <RoundIconButton icon="chevron-back" accessibilityLabel={t.common.back} onPress={onBack} size={controlSizes.touchTarget} />
      <SizedText
        accessibilityRole="header"
        size={isWebShell ? fontSizes.title : fontSizes.heading}
        weight={fontWeights.heavy}
        numberOfLines={ValueConstants.one}
        style={styles.title}
      >
        {t.shopping.title}
      </SizedText>
      {onShare === null ? null : (
        <RoundIconButton icon="share-outline" accessibilityLabel={t.shopping.share} onPress={onShare} size={controlSizes.touchTarget} />
      )}
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
