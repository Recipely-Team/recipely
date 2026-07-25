import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, avatarSizes, mediaSizes, layoutSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface VerifyHeroProps {
  isLandscapeShell: boolean;
  email: string;
}

/** Mail badge + title/subtitle (and target email) atop the verify screen. */
export const VerifyHero = ({ isLandscapeShell, email }: VerifyHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.gradientCenter, isLandscapeShell ? styles.heroLandscape : null]}>
      <View style={[styles.iconBadge, { backgroundColor: colors.gradientSurface }]}>
        <Ionicons name="mail-unread-outline" size={iconSizes.xxl} color={colors.onOverlay} />
      </View>
      <ThemedText variant="subtitle" style={[styles.heroTitle, { color: colors.onOverlay }]}>
        {t().verify.title}
      </ThemedText>
      <View style={styles.heroSubtitleWrap}>
        <ThemedText variant="body" style={[styles.heroSubtitle, { color: colors.onOverlay }]}>
          {t().verify.subtitle}
        </ThemedText>
        {email.length > ValueConstants.zero ? (
          <ThemedText variant="body" style={[styles.heroEmail, { color: colors.onOverlay }]}>
            {email}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientCenter: {
    height: mediaSizes.heroImageHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  heroLandscape: {
    height: 'auto',
    maxWidth: layoutSizes.maxContentLg,
  },
  iconBadge: {
    width: avatarSizes.lg,
    height: avatarSizes.lg,
    borderRadius: radii.round,
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
    alignItems: 'center',
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  heroEmail: {
    textAlign: 'center',
    fontWeight: fontWeights.bold,
    marginTop: spacing.xxs,
  },
});
