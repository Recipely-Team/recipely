import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueConstants } from '@core/constants';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorsRoundButton } from '@presentation/app/creators/shared/body/creators-round-button';
import { t } from '@presentation/i18n';

export interface CreatorsPageHeaderProps {
  onBack: () => void;
  /** The page's name beside the back button; the creator page has none. */
  title?: string;
  /** One round action at the far end — the creator page's share. */
  trailing?: ReactNode;
}

/**
 * The creators pages' top bar: a round back button, then the title, then an
 * optional action, as the prototype draws both pages.
 *
 * @remarks
 * - **Safe-area inset on the app only.** The web shell draws its own chrome
 *   above, so there it sits a plain step below it (rule 6b2).
 */
export const CreatorsPageHeader = ({ onBack, title, trailing }: CreatorsPageHeaderProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();

  return (
    <View style={[styles.bar, { paddingTop: isWebShell ? spacing.md : insets.top + spacing.md }]}>
      <CreatorsRoundButton icon="chevron-back" label={t().creators.back} onPress={onBack} />
      <View style={styles.title}>
        {title !== undefined ? (
          <SizedText size={fontSizes.subheading} weight={fontWeights.bold} accessibilityRole="header" numberOfLines={ValueConstants.one}>
            {title}
          </SizedText>
        ) : null}
      </View>
      {trailing ?? null}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    flex: ValueConstants.one,
  },
});
