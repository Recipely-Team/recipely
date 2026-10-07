import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, iconSizes, opacities, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';
import { CreatorAccountMetrics } from '@presentation/app/edit-profile/model/creator-account-metrics';
import { t } from '@presentation/i18n';

export interface CreatorAddRowProps {
  platform: CreatorPlatformType;
  disabled: boolean;
  onPress: (platform: CreatorPlatformType) => void;
}

/** "Link Instagram account" — a platform with no claim; opens the link form in its place. */
export const CreatorAddRow = ({ platform, disabled, onPress }: CreatorAddRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const label = t().creators.account.linkAccount.replace('{platform}', creatorPlatformName(platform));
  return (
    <Pressable
      onPress={() => onPress(platform)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressed : opacities.full }]}
    >
      <CreatorPlatformMark platform={platform} size={creatorMarkGeometry.row} />
      <SizedText size={fontSizes.body} weight={fontWeights.bold} numberOfLines={ValueConstants.one} style={styles.label}>
        {label}
      </SizedText>
      <Ionicons name="add" size={iconSizes.lg} color={colors.primary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: CreatorAccountMetrics.addRowMinHeight,
    paddingHorizontal: spacing.lg,
  },
  label: {
    flex: ValueConstants.one,
  },
});
