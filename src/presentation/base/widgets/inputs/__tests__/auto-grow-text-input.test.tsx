/**
 * The native half of the `auto-grow-text-input` platform pair.
 *
 * It must stay a `multiline` field with a floor and no ceiling: an
 * unconstrained multiline TextInput lays out to its content on native, so a
 * `height` here — or a missing `multiline` — is exactly what would put a long
 * recipe step back inside a scrolling box.
 */

import type { ReactTestInstance } from 'react-test-renderer';
import { TextInput, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { spacing, controlSizes } from '@presentation/base/theme';

const inputStyle = (root: ReactTestInstance): TextStyle =>
  StyleSheet.flatten(root.findByType(TextInput).props.style as StyleProp<TextStyle>);

describe('AutoGrowTextInput (native)', () => {
  it('renders a multiline field floored at minHeight and never pinned', () => {
    const { root } = renderComponent(
      <AutoGrowTextInput minHeight={controlSizes.messageField} value="" onChangeText={jest.fn()} />,
    );

    expect(root.findByType(TextInput).props.multiline).toBe(true);
    expect(inputStyle(root).minHeight).toBe(controlSizes.messageField);
    expect(inputStyle(root).height).toBeUndefined();
  });

  it('lets a caller style win without reintroducing a fixed height', () => {
    const { root } = renderComponent(
      <AutoGrowTextInput
        minHeight={controlSizes.textArea}
        style={{ paddingTop: spacing.md }}
        value="a long step"
        onChangeText={jest.fn()}
      />,
    );

    expect(inputStyle(root).paddingTop).toBe(spacing.md);
    expect(inputStyle(root).minHeight).toBe(controlSizes.textArea);
    expect(inputStyle(root).height).toBeUndefined();
  });

  it('starts the caret at the top so an empty field does not centre it', () => {
    const { root } = renderComponent(
      <AutoGrowTextInput minHeight={controlSizes.textArea} value="" onChangeText={jest.fn()} />,
    );

    expect(root.findByType(TextInput).props.textAlignVertical).toBe('top');
  });
});
