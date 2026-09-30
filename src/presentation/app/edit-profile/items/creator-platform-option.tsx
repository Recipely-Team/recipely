import { Pressable, StyleSheet } from 'react-native';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';

export interface CreatorPlatformOptionProps {
  platform: CreatorPlatformType;
  selected: boolean;
  onPick: (platform: CreatorPlatformType) => void;
}

/** One radio of the claim form's platform choice: the mark and the platform's name. */
export const CreatorPlatformOption = ({ platform, selected, onPick }: CreatorPlatformOptionProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={() => onPick(platform)}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={creatorPlatformName(platform)}
      style={({ pressed }) => [
        styles.option,
        selected
          ? { borderWidth: borderWidths.medium, borderColor: colors.primary, backgroundColor: colors.primaryLight }
          : { borderWidth: borderWidths.hairline, borderColor: colors.border, backgroundColor: colors.surface },
        { opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <CreatorPlatformMark platform={platform} size={creatorMarkGeometry.option} />
      <SizedText
        size={fontSizes.medium}
        weight={selected ? fontWeights.bold : fontWeights.semibold}
        color={selected ? colors.primary : colors.text}
      >
        {creatorPlatformName(platform)}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  option: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.touchTarget,
    borderRadius: radii.lg,
  },
});
