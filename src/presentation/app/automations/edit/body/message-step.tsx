import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DmMessageToken } from '@domain/instagram/dm/dm-message-token';
import { DmRuleLimits } from '@domain/instagram/dm/dm-rule-limits';
import { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { AutomationSwitch } from '@presentation/app/automations/shared/items/automation-switch';
import { DmPreview } from '@presentation/app/automations/edit/body/dm-preview';
import { borderWidths, controlSizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';

export interface MessageStepProps {
  /** Lets the assistant move this step's list. */
  scrollable: AssistantScrollableProps;
  handle: string;
  dmText: string;
  replyOn: boolean;
  replyText: string;
  recipeName: string | null;
  recipeImage: string | null;
  isEdit: boolean;
  onDmText: (text: string) => void;
  onReplyOn: (on: boolean) => void;
  onReplyText: (text: string) => void;
  onDelete: () => void;
}

const TOKENS = [DmMessageToken.Name, DmMessageToken.Link] as const;

/**
 * Step 4 (spec §3): the private reply with `{name}` / `{link}` to insert
 * (`{link}` required), its counter, the optional public reply, Delete for an
 * existing rule — and the live preview beside the fields once expanded,
 * under them on a phone.
 */
export const MessageStep = (props: MessageStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isExpanded } = useLayout();
  const copy = t().instagram;
  const linkMissing = !props.dmText.includes(DmMessageToken.Link);
  const overLimit = props.dmText.length > DmRuleLimits.DmTextMax;
  const field = { color: colors.text, backgroundColor: colors.inputBackground, borderColor: linkMissing ? colors.danger : colors.inputBorder };
  const preview = (
    <DmPreview
      handle={props.handle}
      dmText={props.dmText}
      recipeName={props.recipeName}
      recipeImage={props.recipeImage}
      publicReply={props.replyOn ? props.replyText : null}
    />
  );
  return (
    <ScrollView {...props.scrollable} contentContainerStyle={[styles.stack, isExpanded ? styles.columns : null]} keyboardShouldPersistTaps="handled">
      <View style={styles.fields}>
        <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
          {copy.messageTitle}
        </SizedText>
        <SizedText size={fontSizes.small} weight={fontWeights.bold} muted>
          {copy.privateReply}
        </SizedText>
        <AutoGrowTextInput
          value={props.dmText}
          onChangeText={props.onDmText}
          minHeight={controlSizes.messageField}
          accessibilityLabel={copy.privateReply}
          style={[styles.input, field]}
        />
        <View style={styles.tokens}>
          <SizedText size={fontSizes.small} muted>
            {copy.insert}
          </SizedText>
          {TOKENS.map((token) => (
            <Pressable
              key={token}
              onPress={() => props.onDmText(`${props.dmText}${CharConstants.space}${token}`)}
              accessibilityRole="button"
              style={[styles.token, { backgroundColor: colors.chipBackground }]}
            >
              <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.chipText} style={styles.mono}>
                {token}
              </SizedText>
            </Pressable>
          ))}
          <SizedText size={fontSizes.small} color={overLimit ? colors.danger : colors.textMuted} style={styles.counter}>
            {copy.counter.replace('{n}', String(props.dmText.length)).replace('{max}', String(DmRuleLimits.DmTextMax))}
          </SizedText>
        </View>
        <SizedText size={fontSizes.small} color={linkMissing ? colors.danger : colors.textSubtle} role={linkMissing ? 'alert' : undefined}>
          {linkMissing ? copy.linkMissing : copy.cardHelper}
        </SizedText>
        <View style={styles.switchRow}>
          <SizedText size={fontSizes.medium} weight={fontWeights.semibold} style={styles.grow}>
            {copy.replyToggle}
          </SizedText>
          <AutomationSwitch value={props.replyOn} disabled={false} onChange={props.onReplyOn} />
        </View>
        {props.replyOn ? (
          <>
            <AutoGrowTextInput
              value={props.replyText}
              onChangeText={props.onReplyText}
              minHeight={controlSizes.searchBar}
              maxLength={DmRuleLimits.PublicReplyMax}
              accessibilityLabel={copy.replyLabel}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.inputBackground, borderColor: DmRuleDraft.isPublicReplyValid(props.replyText) ? colors.inputBorder : colors.danger },
              ]}
            />
            <SizedText size={fontSizes.small} color={colors.textSubtle}>
              {copy.replyHint}
            </SizedText>
          </>
        ) : null}
        {props.isEdit ? (
          <Pressable onPress={props.onDelete} accessibilityRole="button" style={styles.delete}>
            <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.danger}>
              {copy.deleteRule}
            </SizedText>
          </Pressable>
        ) : null}
      </View>
      <View style={isExpanded ? styles.previewColumn : null}>{preview}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.lg, paddingBottom: spacing.xl },
  columns: { flexDirection: 'row', alignItems: 'flex-start' },
  fields: { flex: ValueConstants.one, gap: spacing.sm },
  previewColumn: { width: AutomationMetrics.previewColumn },
  input: { borderRadius: radii.lg, borderWidth: borderWidths.hairline, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSizes.body },
  tokens: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  token: { minHeight: controlSizes.iconBtnSm, paddingHorizontal: spacing.md, borderRadius: radii.round, justifyContent: 'center' },
  mono: { fontFamily: 'monospace' },
  counter: { marginLeft: 'auto' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: controlSizes.touchTarget, marginTop: spacing.sm },
  grow: { flex: ValueConstants.one },
  delete: { minHeight: controlSizes.touchTarget, justifyContent: 'center', marginTop: spacing.md },
});
