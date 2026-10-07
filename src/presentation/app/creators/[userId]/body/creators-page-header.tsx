import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueConstants } from '@core/constants';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorsRoundButton } from '@presentation/app/creators/[userId]/body/creators-round-button';
import { t } from '@presentation/i18n';

export interface CreatorsPageHeaderProps {
  onBack: () => void;
  /** The web back link's words; "Back" when omitted. */
  backLabel?: string;
  /** One round action at the far end — the creator page's share. */
  trailing?: ReactNode;
}

/**
 * A creator page's top: on a phone a bar with a 44 round back button and an
 * optional action; on the web a text back link (14/600 `textMuted`), "Back to
 * chefs" (design spec → Creator profile §6).
 *
 * @remarks
 * - **Safe-area inset on the app only.** The web shell draws its own chrome
 *   above, so there it sits a plain step below it (rule 6b2).
 */
export const CreatorsPageHeader = ({ onBack, backLabel, trailing }: CreatorsPageHeaderProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const colors = useTheme().colors;
  const { isWebShell } = useLayout();

  if (isWebShell) {
    const label = backLabel ?? t().creators.back;
    return (
      <View style={styles.web}>
        <View style={styles.webBar}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.backLink, { opacity: pressed ? opacities.pressed : opacities.full }]}
          >
            <Ionicons name="chevron-back" size={iconSizes.md} color={colors.textMuted} />
            <SizedText size={fontSizes.medium} weight={fontWeights.semibold} color={colors.textMuted}>
              {label}
            </SizedText>
          </Pressable>
          {trailing ?? null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.md }]}>
      <CreatorsRoundButton icon="chevron-back" label={t().creators.back} onPress={onBack} />
      <View style={styles.spacer} />
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
  spacer: {
    flex: ValueConstants.one,
  },
  web: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  webBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.touchTarget,
  },
});
