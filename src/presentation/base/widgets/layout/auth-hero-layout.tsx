import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTwoPaneSplit } from '@presentation/base/responsive/fold/use-two-pane-split';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontWeights, iconSizes, controlSizes, avatarSizes, mediaSizes, decorSizes, layoutSizes, zIndices, opacities } from '@presentation/base/theme';
import type { IoniconNameType } from '@presentation/base/errors/ionicon-name';
import { ValueConstants } from '@core/constants';

const AUTH_CARD_MAX_WIDTH = layoutSizes.authCardMaxWidth;

export interface AuthHeroLayoutProps {
  icon: IoniconNameType;
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
}

/**
 * The account-recovery shell: a gradient hero (icon, title, subtitle) over a raised card.
 *
 * @remarks
 * - **Landscape on a wide screen splits in two** — hero left, card right — instead of a
 *   short hero squashed above a card the keyboard then covers.
 * - **A separating vertical hinge splits exactly at the hinge** (spanned Duo,
 *   half-opened Fold), whatever the width — see `useTwoPaneSplit`.
 * - **The back button lives only in the stacked layout**; the split layout's card carries
 *   its own back link.
 */
export const AuthHeroLayout = ({ icon, title, subtitle, backLabel, onBack, children }: AuthHeroLayoutProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const split = useTwoPaneSplit();
  const isLandscapeShell = split.isSplit;

  const hero = (
    <View style={[styles.gradientCenter, isLandscapeShell ? styles.heroLandscape : null]}>
      <View style={[styles.iconBadge, { backgroundColor: colors.gradientSurface }]}>
        <Ionicons name={icon} size={isLandscapeShell ? iconSizes.xxxl : iconSizes.xxl} color={colors.onOverlay} />
      </View>
      <ThemedText variant="subtitle" style={[styles.heroTitle, { color: colors.onOverlay }]}>
        {title}
      </ThemedText>
      <View style={styles.heroSubtitleWrap}>
        <ThemedText variant="body" style={[styles.heroSubtitle, { color: colors.onOverlay }]}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );

  if (isLandscapeShell) {
    return (
      <KeyboardAvoider style={styles.flex}>
        <View style={[styles.splitRoot, split.rowStyle, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={[styles.splitHero, split.firstPaneStyle]}
          >
            {hero}
          </LinearGradient>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.splitFormContent}
            style={styles.splitFormPane}
          >
            <View style={[styles.card, styles.cardSplit, { backgroundColor: colors.cardBackground }, shadows.lg]}>
              {children}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoider>
    );
  }

  return (
    <KeyboardAvoider style={styles.flex}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: colors.background }}
      >
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.one }}
          style={styles.gradient}
        >
          {hero}
        </LinearGradient>
        <Pressable
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.gradientSurface }]}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }, shadows.lg]}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  flex: { flex: ValueConstants.one },
  scrollContent: { flexGrow: ValueConstants.one },
  gradient: {
    borderBottomLeftRadius: radii.xxxl,
    borderBottomRightRadius: radii.xxxl,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.xxxl,
    left: spacing.lg,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: controlSizes.iconBtn / ValueConstants.two,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndices.raised,
  },
  gradientCenter: {
    minHeight: mediaSizes.heroImageHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  iconBadge: {
    width: avatarSizes.lg,
    height: avatarSizes.lg,
    borderRadius: radii.xxl2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  heroSubtitleWrap: {
    opacity: opacities.onMedia,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  card: {
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: -decorSizes.cardOverlap,
    marginBottom: spacing.xxl,
  },
  splitRoot: {
    flex: ValueConstants.one,
    flexDirection: 'row',
  },
  splitHero: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  heroLandscape: {
    minHeight: ValueConstants.zero,
    maxWidth: layoutSizes.maxContentLg,
  },
  splitFormPane: {
    flex: ValueConstants.one,
  },
  splitFormContent: {
    flexGrow: ValueConstants.one,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  cardSplit: {
    width: '100%',
    maxWidth: AUTH_CARD_MAX_WIDTH,
    marginHorizontal: ValueConstants.zero,
    marginTop: ValueConstants.zero,
    marginBottom: ValueConstants.zero,
  },
});
