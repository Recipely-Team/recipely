import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PHOTO_NOTE_MAX_CHARS } from '@domain/common/photo-note';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, lineHeights, opacities, radii, spacing } from '@presentation/base/theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { useTranslations } from '@presentation/i18n';

export interface PhotoNoteFieldProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  /** Off while the photos are being sent: the note that went is the note on screen. */
  editable: boolean;
}

/**
 * **The optional note under photos sent to the AI** — "only the second recipe",
 * "ignore the sauces" (Claude Design: Board · Photo with a note).
 *
 * @remarks
 * - **Auto-grows from 72 to 160**, then scrolls inside itself, so a long note
 *   never pushes the send button off a phone screen.
 * - **Stops at 300 characters** (`PHOTO_NOTE_MAX_CHARS`, the backend's limit);
 *   the counter turns danger at the limit so the stop is not a mystery.
 * - **Dimmed and read-only while sending**, never hidden: the layout holds still.
 */
export const PhotoNoteField = ({ value, onChangeText, placeholder, editable }: PhotoNoteFieldProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const danger = useSeveritySurfaces().danger;
  const inputLineHeight = useTextLineHeight(fontSizes.body);
  const [isFocused, setIsFocused] = useState(false);
  const isFull = value.length >= PHOTO_NOTE_MAX_CHARS;
  const counter = `${value.length}/${PHOTO_NOTE_MAX_CHARS}`;

  return (
    <View style={[styles.root, editable ? null : styles.disabled]}>
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {t.photoNote.label}
      </SizedText>
      <AutoGrowTextInput
        accessibilityLabel={t.photoNote.label}
        minHeight={controlSizes.photoNoteField}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={PHOTO_NOTE_MAX_CHARS}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            color: colors.text,
            lineHeight: inputLineHeight,
            backgroundColor: colors.inputBackground,
            borderColor: isFocused ? colors.inputBorderFocused : colors.inputBorder,
          },
        ]}
      />
      <SizedText
        size={fontSizes.caption}
        ratio={lineHeights.normal}
        muted={!isFull}
        style={[styles.counter, isFull ? { color: danger.icon } : null]}
        accessibilityLabel={t.photoNote.counterA11y.replace('{count}', String(value.length)).replace('{max}', String(PHOTO_NOTE_MAX_CHARS))}
      >
        {counter}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  disabled: { opacity: opacities.disabledFaint },
  input: {
    maxHeight: controlSizes.photoNoteFieldMax,
    borderWidth: borderWidths.thin,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.body,
  },
  counter: { alignSelf: 'flex-end' },
});
