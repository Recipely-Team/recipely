import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, opacities, radii } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorAccountMetrics } from '@presentation/app/edit-profile/model/creator-account-metrics';

export interface CreatorRowActionProps {
  label: string;
  /** Primary for Try again; ghost (no fill, `text`) for Withdraw and Unlink. */
  primary: boolean;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  /** Takes its container's width — the link form's Submit. */
  fill?: boolean;
}

/** A platform row's one action: 44 high, round, 14/700, sized to its label and left-aligned (design spec §7, rev 2). */
export const CreatorRowAction = ({ label, primary, loading, disabled, onPress, fill = false }: CreatorRowActionProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const ink = primary ? colors.primaryText : colors.text;
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        fill ? styles.fill : null,
        primary ? { backgroundColor: colors.primary } : null,
        { opacity: disabled ? opacities.disabled : pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={ink}>
          {label}
        </SizedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controlSizes.touchTarget,
    paddingHorizontal: CreatorAccountMetrics.actionPadding,
    borderRadius: radii.round,
  },
  fill: {
    alignSelf: 'stretch',
  },
});
