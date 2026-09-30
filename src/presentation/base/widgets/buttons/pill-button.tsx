import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { borderWidths, controlSizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PillButtonTone, type PillButtonToneType } from '@presentation/base/widgets/buttons/pill-button-tone';

export interface PillButtonProps {
  label: string;
  onPress: () => void;
  tone?: PillButtonToneType;
  /** Swaps the label for a spinner and ignores presses. */
  loading?: boolean;
  disabled?: boolean;
  /** Says what the press does when the label alone does not ("Follow" → "Follow Ayşe"). */
  accessibilityLabel?: string;
}

/**
 * A fully rounded button, as the creators surfaces draw their actions.
 *
 * @remarks
 * - **Primary is 48 tall, outline actions 44** — the lead action is the
 *   bigger target, as in the prototype, and both clear the 44pt minimum.
 * - **The danger label is the severity palette's danger text**, not
 *   `colors.danger`: that one is a fill colour and falls under 4.5:1 as text
 *   on a light card.
 */
export const PillButton = ({
  label,
  onPress,
  tone = PillButtonTone.Primary,
  loading = false,
  disabled = false,
  accessibilityLabel,
}: PillButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const severity = useSeveritySurfaces();
  const primary = tone === PillButtonTone.Primary;
  const ink = primary ? colors.primaryText : tone === PillButtonTone.Danger ? severity.danger.text : colors.text;
  const inactive = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        primary ? [styles.primary, { backgroundColor: colors.primary }] : [styles.outline, { borderColor: colors.border }],
        { opacity: disabled ? opacities.disabled : pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <SizedText size={primary ? fontSizes.body : fontSizes.medium} weight={fontWeights.bold} color={ink} style={styles.label}>
          {label}
        </SizedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.round,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    minHeight: controlSizes.buttonSm,
  },
  outline: {
    minHeight: controlSizes.touchTarget,
    borderWidth: borderWidths.hairline,
  },
  label: {
    textAlign: 'center',
  },
});
