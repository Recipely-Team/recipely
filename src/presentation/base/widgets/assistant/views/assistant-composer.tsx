import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  borderWidths,
  controlSizes,
  fontWeights,
  iconSizes,
  opacities,
  radii,
  spacing,
} from '@presentation/base/theme';
import { CharConstants, ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface AssistantComposerProps {
  onSend: (text: string) => void;
  onSwitchToVoice: () => void;
}

/**
 * The panel's typing half.
 *
 * @remarks
 * - **Typing is never a downgrade.** Voice runs out, a kitchen gets loud, and
 *   someone else is asleep in the next room — all routine. So this half has the
 *   same standing as the microphone, including the suggestions that make the
 *   first turn one tap rather than a blank field.
 * - **The suggestions are examples of what the assistant can do**, not canned
 *   queries: a user who has never spoken to it has no way to guess its reach,
 *   and the reach is the feature.
 */
export const AssistantComposer = ({ onSend, onSwitchToVoice }: AssistantComposerProps): React.JSX.Element => {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(CharConstants.empty);
  const ready = draft.trim() !== CharConstants.empty;

  const submit = (): void => {
    if (!ready) return;
    onSend(draft.trim());
    setDraft(CharConstants.empty);
  };

  return (
    <View style={styles.composer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
        {t().assistant.suggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => onSend(suggestion)}
            accessibilityRole="button"
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            <ThemedText variant="caption" style={styles.chipLabel}>
              {suggestion}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.row}>
        <Pressable onPress={onSwitchToVoice} accessibilityRole="button" accessibilityLabel={t().assistant.voice}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={gradientStart}
            end={gradientEnd}
            style={styles.round}
          >
            <Ionicons name="mic" size={iconSizes.lg} color={colors.onOverlay} />
          </LinearGradient>
        </Pressable>

        <AutoGrowTextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t().assistant.placeholder}
          minHeight={controlSizes.searchBar}
          style={styles.input}
        />

        <Pressable
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.send}
          disabled={!ready}
          style={[
            styles.round,
            {
              backgroundColor: ready ? colors.primary : colors.surface,
              borderColor: ready ? colors.primary : colors.cardBorder,
              borderWidth: borderWidths.hairline,
              opacity: ready ? opacities.full : opacities.disabledFaint,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={iconSizes.lg}
            color={ready ? colors.primaryText : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
};

const gradientStart = { x: 0, y: 0 } as const;
const gradientEnd = { x: 1, y: 1 } as const;

const styles = StyleSheet.create({
  composer: { gap: spacing.sm },
  suggestions: { gap: spacing.xs, paddingBottom: spacing.xxs },
  chip: {
    minHeight: controlSizes.chip,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  chipLabel: { fontWeight: fontWeights.semibold },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  // Pinned: circular buttons, not text boxes.
  round: {
    width: controlSizes.searchBar,
    height: controlSizes.searchBar,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
  input: { flex: ValueConstants.one },
});
