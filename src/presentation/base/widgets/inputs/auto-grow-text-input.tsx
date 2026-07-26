import { StyleSheet, TextInput } from 'react-native';
import type { AutoGrowTextInputProps } from '@presentation/base/widgets/inputs/auto-grow-text-input-props';

/**
 * Multi-line text field that grows with what is typed into it instead of
 * scrolling inside a fixed box.
 *
 * On native this needs no measuring: an unconstrained `multiline` TextInput
 * already lays out to its content height, so the only job here is to stop the
 * empty field from collapsing below `minHeight`. The web build needs real work
 * — see `auto-grow-text-input.web.tsx`.
 */
export const AutoGrowTextInput = ({
  minHeight,
  style,
  ...rest
}: AutoGrowTextInputProps): React.JSX.Element => (
  <TextInput multiline textAlignVertical="top" style={[styles.base, { minHeight }, style]} {...rest} />
);

const styles = StyleSheet.create({
  base: {
    // A multiline field is read top-down; centring it leaves the caret
    // floating in the middle of an empty box.
    textAlignVertical: 'top',
  },
});
