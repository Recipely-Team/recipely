import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';

export interface FollowButtonProps {
  isFollowing: boolean;
  label: string;
  /** Names the creator ("Follow Ayşe"). */
  accessibilityLabel: string;
  isPending: boolean;
  onPress: () => void;
}

/**
 * The creator page's 48-high follow toggle (design spec → Creators §6.6):
 * `primary` with a plus while not following; `surface` with a 1.5 `cardBorder`
 * and a check once following. A toggle button, so its pressed state is read out.
 */
export const FollowButton = ({ isFollowing, label, accessibilityLabel, isPending, onPress }: FollowButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const ink = isFollowing ? colors.text : colors.primaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      accessibilityRole="togglebutton"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: isFollowing, busy: isPending, disabled: isPending }}
      style={({ pressed }) => [
        styles.button,
        isFollowing
          ? [styles.following, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]
          : { backgroundColor: colors.primary },
        { opacity: isPending ? opacities.disabled : pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      {isPending ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          <Ionicons name={isFollowing ? 'checkmark' : 'add'} size={iconSizes.md} color={ink} />
          <SizedText size={fontSizes.body} weight={fontWeights.bold} color={ink}>
            {label}
          </SizedText>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
  },
  following: {
    borderWidth: borderWidths.thin,
  },
});
