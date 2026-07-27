import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RefineTranscript } from '@presentation/app/create-recipe/body/refine-transcript';
import { RefinePendingRow } from '@presentation/app/create-recipe/items/refine-pending-row';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { ChatMessage } from '@domain/drafts/chat-message';
import { useKeyboardVisible } from '@presentation/app/create-recipe/hooks/use-keyboard-visible';
import { ValueConstants } from '@core/constants';

export interface RefineDockProps {
  chatHistory: readonly ChatMessage[];
  chatInput: string;
  onChangeChatInput: (value: string) => void;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  refining: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onSubmit: (instruction: string) => void;
  bottomInset: number;
}

const QUICK_CHIP_KEYS = ['chipVegan', 'chipFaster', 'chipSpicier', 'chipHealthier', 'chipKid'] as const;

/** Longest the close waits for `keyboardDidHide` before collapsing anyway. */
const KEYBOARD_HIDE_TIMEOUT_MS = 400;

/** Sticky bottom AI dock: chat transcript, quick chips, "Try again", free-text. */
export const RefineDock = ({
  chatHistory,
  chatInput,
  onChangeChatInput,
  expanded,
  onExpand,
  onCollapse,
  refining,
  canRegenerate,
  onRegenerate,
  onSubmit,
  bottomInset,
}: RefineDockProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const canSend = chatInput.trim().length > ValueConstants.zero && !refining;
  // WHY: `KeyboardAvoidingView` (in the parent screen) already pads its content
  // up flush with the keyboard's top edge once shown — that alone clears the
  // home indicator area too, since the keyboard occludes it. Adding the fixed
  // `bottomInset` (needed only while the keyboard is hidden) on top of that
  // padding left a visible gap between the input and the keyboard.
  const keyboardVisible = useKeyboardVisible();
  const resolvedBottomInset = keyboardVisible ? ValueConstants.zero : bottomInset;

  const submitFreeText = (): void => {
    if (!canSend) return;
    onSubmit(chatInput.trim());
  };

  // WHY the two steps are serialized: dismissing the keyboard and unmounting
  // the transcript in the same frame ran two layout animations against each
  // other, and the dock visibly jumped. Waiting for the keyboard to finish
  // hiding costs nothing and the panel closes into a settled layout. The
  // timeout is the escape hatch for a platform that never emits the event.
  const closeAssistant = (): void => {
    if (!keyboardVisible) {
      onCollapse();
      return;
    }
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      sub.remove();
      clearTimeout(fallback);
      onCollapse();
    });
    const fallback = setTimeout(() => {
      sub.remove();
      onCollapse();
    }, KEYBOARD_HIDE_TIMEOUT_MS);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {expanded ? (
        <RefineTranscript chatHistory={chatHistory} refining={refining} onClose={closeAssistant} />
      ) : refining ? (
        <RefinePendingRow />
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={onRegenerate}
          disabled={!canRegenerate || refining}
          style={[
            styles.regenChip,
            { borderColor: colors.primary, opacity: canRegenerate && !refining ? opacities.full : opacities.disabledStrong },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.regenerate}
        >
          <Ionicons name="refresh" size={iconSizes.md} color={colors.primary} />
          <ThemedText variant="caption" style={[styles.regenLabel, { color: colors.primary }]}>
            {t().createRecipe.regenerate}
          </ThemedText>
        </Pressable>
        {QUICK_CHIP_KEYS.map((key) => {
          const label = t().createRecipe[key];
          return (
            <Pressable
              key={key}
              onPress={() => onSubmit(label)}
              disabled={refining}
              style={[
                styles.quickChip,
                { borderColor: colors.border, backgroundColor: colors.background, opacity: refining ? opacities.disabled : opacities.full },
              ]}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <ThemedText variant="caption" style={[styles.quickChipLabel, { color: colors.text }]}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: resolvedBottomInset + spacing.md }]}>
        <View style={[styles.inputField, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}>
          <Ionicons name="sparkles" size={iconSizes.md} color={colors.primary} />
          <TextInput
            value={chatInput}
            onChangeText={onChangeChatInput}
            onFocus={onExpand}
            placeholder={t().createRecipe.refinePlaceholder}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={submitFreeText}
            returnKeyType="send"
            style={[styles.input, { color: colors.text }]}
          />
          <Pressable
            onPress={submitFreeText}
            disabled={!canSend}
            style={[styles.sendBtn, { backgroundColor: canSend ? colors.primary : colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={t().createRecipe.refinePlaceholder}
          >
            <Ionicons name="arrow-up" size={iconSizes.md} color={colors.primaryText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chipScroll: {
    gap: spacing.xs2,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  regenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  regenLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.small,
  },
  quickChip: {
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
  inputRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.searchBar,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
  input: {
    flex: ValueConstants.one,
    fontSize: fontSizes.medium,
    paddingVertical: ValueConstants.zero,
  },
  sendBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
