import { useEffect, useRef } from 'react';
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
import { RefineProposalCard } from '@presentation/app/create-recipe/items/refine-proposal-card';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { RefineProposal } from '@presentation/app/create-recipe/model/refine/refine-proposal';
import { useKeyboardVisible } from '@presentation/app/create-recipe/hooks/use-keyboard-visible';
import { CharConstants, ValueConstants } from '@core/constants';

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
  /** The change awaiting a decision, or null when there is nothing to decide. */
  proposal: RefineProposal | null;
  onAcceptProposal: () => void;
  onRejectProposal: () => void;
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
  proposal,
  onAcceptProposal,
  onRejectProposal,
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

  // Clearing belongs to the free-text path, not to `onSubmit`: a quick chip
  // sends its own instruction and must leave whatever the cook has typed alone.
  // The sent text is not lost — `onSubmitRefine` appends it to the transcript
  // above before the request goes out, so it stays on screen as their turn.
  const submitFreeText = (): void => {
    if (!canSend) return;
    onSubmit(chatInput.trim());
    onChangeChatInput(CharConstants.empty);
  };

  // WHY the two steps are serialized: dismissing the keyboard and unmounting
  // the transcript in the same frame ran two layout animations against each
  // other, and the dock visibly jumped. Waiting for the keyboard to finish
  // hiding costs nothing and the panel closes into a settled layout. The
  // timeout is the escape hatch for a platform that never emits the event.
  const pendingClose = useRef<(() => void) | null>(null);

  // A close in flight is cancelled on unmount (the exit sheet can take the
  // screen down inside the window) and before starting another, so a second
  // tap cannot stack a second listener and timer.
  useEffect(() => () => pendingClose.current?.(), []);

  const closeAssistant = (): void => {
    pendingClose.current?.();
    if (!keyboardVisible) {
      onCollapse();
      return;
    }
    const finish = (): void => {
      pendingClose.current = null;
      onCollapse();
    };
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      cancel();
      finish();
    });
    const fallback = setTimeout(() => {
      cancel();
      finish();
    }, KEYBOARD_HIDE_TIMEOUT_MS);
    const cancel = (): void => {
      sub.remove();
      clearTimeout(fallback);
      pendingClose.current = null;
    };
    pendingClose.current = cancel;
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {expanded ? (
        <RefineTranscript chatHistory={chatHistory} refining={refining} onClose={closeAssistant} />
      ) : refining ? (
        <RefinePendingRow />
      ) : null}

      {/* Above the input and outside the transcript: the decision has to be
          reachable whether or not the cook has the assistant panel open. */}
      {proposal !== null ? (
        <RefineProposalCard
          changes={proposal.changes}
          onAccept={onAcceptProposal}
          onReject={onRejectProposal}
        />
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
