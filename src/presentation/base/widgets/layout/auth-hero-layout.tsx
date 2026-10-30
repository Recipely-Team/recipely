import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HeroCardShell } from '@presentation/base/widgets/layout/hero-card-shell';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes, avatarSizes, mediaSizes, decorSizes, layoutSizes, zIndices, opacities } from '@presentation/base/theme';
import type { IoniconNameType } from '@presentation/base/errors/ionicon-name';
import { ValueConstants } from '@core/constants';

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
 * - **Built on `HeroCardShell`**, so the card keeps its state when the layout changes.
 */
export const AuthHeroLayout = ({ icon, title, subtitle, backLabel, onBack, children }: AuthHeroLayoutProps): React.JSX.Element => {
  const colors = useTheme().colors;

  const hero = (isLandscapeShell: boolean): React.JSX.Element => (
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

  return (
    <HeroCardShell
      splitHero={hero(true)}
      stackedHeader={
        <>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.one }}
            style={styles.gradient}
          >
            {hero(false)}
          </LinearGradient>
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: colors.gradientSurface }]}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
          >
            <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
          </Pressable>
        </>
      }
      stackedCardStyle={styles.card}
    >
      {children}
    </HeroCardShell>
  );
};

const styles = StyleSheet.create({
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
    marginTop: -decorSizes.cardOverlap,
    marginBottom: spacing.xxl,
  },
  heroLandscape: {
    minHeight: ValueConstants.zero,
    maxWidth: layoutSizes.maxContentLg,
  },
});
