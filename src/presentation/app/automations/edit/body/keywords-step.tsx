import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { DmKeywords } from '@domain/instagram/dm/dm-keywords';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { RemovableKeyword } from '@presentation/app/automations/edit/items/removable-keyword';
import { borderWidths, controlSizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';

export interface KeywordsStepProps {
  /** Lets the assistant move this step's list. */
  scrollable: AssistantScrollableProps;
  keywords: DmKeywords;
  input: string;
  error: string | null;
  onInput: (text: string) => void;
  onAdd: (raw: string) => void;
  onRemove: (word: string) => void;
}

const SEPARATOR = ',';

/**
 * Step 2 (spec §3): the trigger words — typed (Enter or a comma adds),
 * suggested, removable — and a test box that says whether a comment would
 * match, folding case the way the server does.
 */
export const KeywordsStep = ({ keywords, input, error, onInput, onAdd, onRemove, scrollable }: KeywordsStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const surfaces = useSeveritySurfaces();
  const locale = useLocale();
  const copy = t().instagram;
  const [comment, setComment] = useState(CharConstants.empty);
  const match = comment.trim().length === ValueConstants.zero ? undefined : keywords.matchIn(comment, locale);
  const look = match === null ? surfaces[SeverityType.Neutral] : surfaces[SeverityType.Success];
  const field = [styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }];

  return (
    <ScrollView {...scrollable} contentContainerStyle={styles.stack} keyboardShouldPersistTaps="handled">
      <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
        {copy.keywordsTitle}
      </SizedText>
      <SizedText size={fontSizes.caption} color={colors.textSubtle}>
        {copy.keywordsBody}
      </SizedText>
      <View style={styles.addRow}>
        <TextInput
          value={input}
          onChangeText={(text) => (text.endsWith(SEPARATOR) ? onAdd(text.slice(ValueConstants.zero, -SEPARATOR.length)) : onInput(text))}
          onSubmitEditing={() => onAdd(input)}
          placeholder={copy.keywordPlaceholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={copy.keywordPlaceholder}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit={false}
          style={[...field, styles.grow]}
        />
        <Pressable onPress={() => onAdd(input)} disabled={keywords.isFull} accessibilityRole="button" style={[styles.add, { backgroundColor: colors.primary }]}>
          <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.primaryText}>
            {copy.add}
          </SizedText>
        </Pressable>
      </View>
      <SizedText size={fontSizes.small} color={error === null ? colors.textMuted : colors.danger} role={error === null ? undefined : 'alert'}>
        {error ?? copy.keywordsMax}
      </SizedText>
      <View style={styles.chips}>
        {keywords.value.map((word) => (
          <RemovableKeyword key={word} word={word} onRemove={onRemove} />
        ))}
      </View>
      <SizedText size={fontSizes.small} weight={fontWeights.bold} muted>
        {copy.suggestionsLabel}
      </SizedText>
      <View style={styles.chips}>
        {copy.suggestions
          .filter((word) => !keywords.value.includes(word))
          .map((word) => (
            <Pressable key={word} onPress={() => onAdd(word)} accessibilityRole="button" style={[styles.suggestion, { borderColor: colors.border }]}>
              <SizedText size={fontSizes.caption} weight={fontWeights.semibold}>
                {`+ ${word}`}
              </SizedText>
            </Pressable>
          ))}
      </View>
      <View style={[styles.test, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <SizedText size={fontSizes.small} weight={fontWeights.bold}>
          {copy.tryComment}
        </SizedText>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={copy.tryPlaceholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={copy.tryComment}
          style={field}
        />
        {match === undefined ? null : (
          <SizedText size={fontSizes.small} weight={fontWeights.bold} color={look.text} role="status">
            {match === null ? copy.noMatch : copy.matches.replace('{k}', match)}
          </SizedText>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md, paddingBottom: spacing.xl },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: ValueConstants.one },
  input: { minHeight: AutomationMetrics.connectButton, borderRadius: radii.lg, borderWidth: borderWidths.hairline, paddingHorizontal: spacing.md, fontSize: fontSizes.body },
  add: { minHeight: AutomationMetrics.connectButton, paddingHorizontal: spacing.lg, borderRadius: radii.lg, justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestion: { minHeight: controlSizes.iconBtnSm, paddingHorizontal: spacing.md, borderRadius: radii.round, borderWidth: borderWidths.hairline, borderStyle: 'dashed', justifyContent: 'center' },
  test: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, borderWidth: borderWidths.hairline, marginTop: spacing.sm },
});
