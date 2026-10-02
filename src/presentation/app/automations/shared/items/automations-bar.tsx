import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const CLOSE = 'close';

export interface AutomationsBarProps {
  title: string;
  /** "Step 2 of 4 · Keywords" under the title; null for none. */
  subtitle: string | null;
  /** Back arrow, or × on the editor. */
  icon: 'chevron-back' | 'close';
  onBack: () => void;
  /** The bar's own action on the right ("+ New", "Edit"). */
  right?: React.ReactNode;
}

/**
 * The automations screens' top bar (spec → Mobile): back, title (+ step
 * line) and one action. In the web shell the global header is already
 * there, so the bar drops the safe-area inset and its hairline.
 */
export const AutomationsBar = ({ title, subtitle, icon, onBack, right }: AutomationsBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const backLabel = icon === CLOSE ? t().instagram.close : t().common.back;
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: isWebShell ? spacing.lg : insets.top + spacing.xs, borderBottomColor: isWebShell ? colors.background : colors.border },
      ]}
    >
      <RoundIconButton
        icon={icon}
        accessibilityLabel={backLabel}
        onPress={onBack}
        size={controlSizes.touchTarget}
      />
      <View style={styles.titles}>
        <SizedText accessibilityRole="header" size={isWebShell ? fontSizes.title : fontSizes.heading} weight={fontWeights.heavy} numberOfLines={ValueConstants.one}>
          {title}
        </SizedText>
        {subtitle === null ? null : (
          <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
            {subtitle}
          </SizedText>
        )}
      </View>
      {right}
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
  titles: { flex: ValueConstants.one, minWidth: ValueConstants.zero },
});
