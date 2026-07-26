import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, type TextStyle } from 'react-native';
import type { AutoGrowTextInputProps } from '@presentation/base/widgets/inputs/auto-grow-text-input-props';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Web implementation of the auto-growing multi-line field.
 *
 * react-native-web renders `multiline` as a real `<textarea>`, and a textarea
 * does NOT grow with its content — it keeps its box and puts a scrollbar down
 * the side, which is what made long recipe steps look broken. RNW's own
 * `onContentSizeChange` cannot fix it either: it reports `scrollHeight`, and
 * once we have applied a height, `scrollHeight` can never come back DOWN, so
 * the field would grow and then stay grown after a delete.
 *
 * So we measure it ourselves: collapse the inline height, read the content's
 * natural `scrollHeight` (floored by the CSS `min-height` we set), and apply
 * that. Writing `style.height` imperatively is safe here because the component
 * never renders a `height` of its own for React to fight over.
 */
// The measurement above is what sizes the box; the browser's own resize grip
// would fight it and leave the field stuck at whatever the user dragged it to.
// `resize` is a CSS property react-native-web honours but RN's TextStyle omits,
// so widen it locally through a plain object (no `unknown` double-cast).
const noResizeGrip = { resize: 'none' } as TextStyle;

export const AutoGrowTextInput = ({
  minHeight,
  style,
  onChangeText,
  value,
  ...rest
}: AutoGrowTextInputProps): React.JSX.Element => {
  const hostRef = useRef<TextInput | null>(null);

  const resize = useCallback((): void => {
    const node = hostRef.current;
    // On web the TextInput ref IS the DOM node; the guard both proves that to
    // TypeScript and skips the (impossible) non-textarea case.
    if (node === null || !(node instanceof HTMLTextAreaElement)) return;
    node.style.height = CharConstants.empty;
    // `scrollHeight` covers content + padding but NEVER the border, while
    // react-native-web puts `box-sizing: border-box` on every element — so a
    // height of exactly `scrollHeight` comes up short by the border and the
    // field keeps a 1-2px scrollbar, which is the whole bug we are here to
    // fix. Add the border back before applying.
    const { borderTopWidth, borderBottomWidth } = window.getComputedStyle(node);
    const border = parseFloat(borderTopWidth) + parseFloat(borderBottomWidth);
    const outer = node.scrollHeight + (Number.isNaN(border) ? ValueConstants.zero : border);
    node.style.height = `${String(outer)}px`;
  }, []);

  // Re-measure whenever the value changes from anywhere — typing, a paste, or
  // the parent resetting the field after a submit.
  useEffect(resize, [resize, value]);

  const handleChangeText = useCallback(
    (next: string): void => {
      onChangeText?.(next);
      resize();
    },
    [onChangeText, resize],
  );

  return (
    <TextInput
      ref={hostRef}
      multiline
      value={value}
      onChangeText={handleChangeText}
      style={[styles.base, noResizeGrip, { minHeight }, style]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    textAlignVertical: 'top',
    overflow: 'hidden',
  },
});
