import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollEndPadding } from '@presentation/base/hooks/interaction/use-scroll-end-padding';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { useTwoPaneSplit } from '@presentation/base/responsive/fold/use-two-pane-split';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, layoutSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface HeroCardShellProps {
  /** The hero inside the left gradient pane of the split layout. */
  splitHero: ReactNode;
  /** Everything above the card in the stacked layout: gradient, back button, hero. */
  stackedHeader: ReactNode;
  /** The card's margins in the stacked layout (how far it overlaps the hero). */
  stackedCardStyle: StyleProp<ViewStyle>;
  /** Shown under the card in both layouts. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * The hero | card shell every sign-in and account-recovery screen sits in.
 *
 * @remarks
 * - **Stacked on a phone, split in two on a wide landscape window** or across a
 *   separating vertical hinge (`useTwoPaneSplit`).
 * - **One tree for both layouts — the card never remounts.** Only styles and the
 *   hero slots change; the scroll view and the card stay at the same position.
 *   The static web export renders stacked (it knows no width), so on a desktop
 *   the page switches to split a few hundred ms after load: when that swapped
 *   in a second tree, the form remounted and whatever the user had typed was lost.
 */
export const HeroCardShell = ({
  splitHero,
  stackedHeader,
  stackedCardStyle,
  footer,
  children,
}: HeroCardShellProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scrollEndPadding = useScrollEndPadding();
  const split = useTwoPaneSplit();
  const isSplit = split.isSplit;

  return (
    <KeyboardAvoider style={styles.flex}>
      <View style={[styles.flex, { backgroundColor: colors.background }, isSplit ? styles.splitRoot : null, split.rowStyle]}>
        {isSplit ? (
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={[styles.splitHero, split.firstPaneStyle]}
          >
            {splitHero}
          </LinearGradient>
        ) : null}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={isSplit ? styles.splitFormContent : [styles.scrollContent, { paddingBottom: scrollEndPadding }]}
          style={isSplit ? styles.flex : null}
        >
          {isSplit ? null : stackedHeader}
          <View
            style={[
              styles.card,
              isSplit ? styles.cardSplit : [styles.cardStacked, stackedCardStyle],
              { backgroundColor: colors.cardBackground },
              shadows.lg,
            ]}
          >
            {children}
          </View>
          {footer}
        </ScrollView>
      </View>
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  flex: { flex: ValueConstants.one },
  scrollContent: { flexGrow: ValueConstants.one },
  splitRoot: { flexDirection: 'row' },
  splitHero: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  splitFormContent: {
    flexGrow: ValueConstants.one,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  card: {
    borderRadius: radii.xxl,
    padding: spacing.xl,
  },
  cardStacked: {
    marginHorizontal: spacing.lg,
  },
  cardSplit: {
    width: '100%',
    maxWidth: layoutSizes.authCardMaxWidth,
  },
});
