import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CharConstants } from '@core/constants';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import type { CreatorTag } from '@domain/creators/creator-tag';
import { instagramProfileUrl, tiktokProfileUrl } from '@presentation/base/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  borderWidths,
  controlSizes,
  fontSizes,
  fontWeights,
  iconSizes,
  opacities,
  radii,
  spacing,
} from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';

export interface CreatorTagChipProps {
  /** An approved tag — the chip says "verified", so it is never drawn for a claim under review. */
  tag: CreatorTag;
}

const profileUrlOf = (tag: CreatorTag): string =>
  tag.platform === CreatorPlatform.TikTok ? tiktokProfileUrl(tag.handle) : instagramProfileUrl(tag.handle);

/**
 * The verified creator badge: platform mark, `@handle` and a check, as one
 * pill that opens the account on its platform.
 *
 * @remarks
 * - **Shown on the creator's page and on the owner's own Profile**, the same
 *   chip in both, so the badge a user earns looks like the one they see on
 *   others.
 * - **A link, not a button.** It leaves the app for the platform, so it says
 *   so to assistive tech, with the platform and handle in its name.
 */
export const CreatorTagChip = ({ tag }: CreatorTagChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const open = t()
    .creators.openAccount.replace('{handle}', tag.displayHandle)
    .replace('{platform}', creatorPlatformName(tag.platform));
  const label = [open, t().creators.verified].join(CharConstants.commaSpace);

  return (
    <Pressable
      onPress={() => void Linking.openURL(profileUrlOf(tag)).catch(() => undefined)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        { opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <CreatorPlatformMark platform={tag.platform} size={creatorMarkGeometry.chip} />
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold}>
        {tag.displayHandle}
      </SizedText>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primary} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.iconBtnSm,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});
