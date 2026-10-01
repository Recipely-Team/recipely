import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueConstants } from '@core/constants';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, iconSizes, letterSpacings, opacities, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorsRoundButton } from '@presentation/app/creators/shared/body/creators-round-button';
import { t } from '@presentation/i18n';

export interface CreatorsPageHeaderProps {
  onBack: () => void;
  /** The page's name: beside the back button on a phone, the h1 under it on the web. The creator page has none. */
  title?: string;
  /** The web back link's words; "Back" when omitted. */
  backLabel?: string;
  /** One round action at the far end — the creator page's share. */
  trailing?: ReactNode;
}

/**
 * The creators pages' top: on a phone a bar with a 44 round back button, the
 * title (24/700) and an optional action; on the web a text back link (14/600
 * `textMuted`) with the title as a 36/800 h1 under it (design spec §5, §6).
 *
 * @remarks
 * - **Safe-area inset on the app only.** The web shell draws its own chrome
 *   above, so there it sits a plain step below it (rule 6b2).
 */
export const CreatorsPageHeader = ({ onBack, title, backLabel, trailing }: CreatorsPageHeaderProps): React.JSX.Element => {
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
        {title !== undefined ? (
          <SizedText size={fontSizes.pageHeading} weight={fontWeights.heavy} accessibilityRole="header" style={styles.h1}>
            {title}
          </SizedText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.md }]}>
      <CreatorsRoundButton icon="chevron-back" label={t().creators.back} onPress={onBack} />
      <View style={styles.title}>
        {title !== undefined ? (
          <SizedText size={fontSizes.title} weight={fontWeights.bold} accessibilityRole="header" numberOfLines={ValueConstants.one}>
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
  web: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
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
  h1: {
    letterSpacing: letterSpacings.tight,
  },
});
