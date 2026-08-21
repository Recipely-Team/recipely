import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { assistantActionLabel } from '@presentation/base/widgets/assistant/assistant-action-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, colorAlphas, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { CharConstants } from '@core/constants';

export interface AssistantActionChipProps {
  action: AssistantActionType;
  detail?: string;
}

/**
 * A receipt for something the assistant did on the user's behalf.
 *
 * @remarks
 * - **Centred, so it reads as neither side speaking.** It is not a turn in the
 *   conversation; it is the app reporting a change, and giving it a speaker's
 *   alignment made the assistant look like it was narrating itself.
 * - **It exists because the user's hands are busy.** Cooking, they may hear the
 *   assistant say it searched and still want to check later what it actually
 *   touched — this is the only place that record survives the audio.
 */
export const AssistantActionChip = ({ action, detail }: AssistantActionChipProps): React.JSX.Element => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.chip,
          { backgroundColor: colors.chipBackground, borderColor: colors.primary + colorAlphas.faint },
        ]}
      >
        <Ionicons name="sparkles" size={iconSizes.xs} color={colors.chipText} />
        <ThemedText variant="caption" style={[styles.label, { color: colors.chipText }]}>
          {assistantActionLabel(action)}
        </ThemedText>
        {detail !== undefined ? (
          <ThemedText variant="caption" style={{ color: colors.chipText }} numberOfLines={1}>
            {CharConstants.middotSpaced + detail}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '92%',
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: { fontWeight: fontWeights.bold },
});
