/**
 * Behavior tests for the KeyboardAvoider widget.
 *
 * The widget wraps react-native's KeyboardAvoidingView and pins
 * `behavior="padding"` on BOTH platforms. Under Expo SDK 54 / RN 0.81
 * edge-to-edge, Android ignores the manifest `adjustResize`, so the legacy
 * `behavior={ios ? 'padding' : undefined}` pattern leaves inputs hidden behind
 * the keyboard. The `behavior` assertion below is the regression guard: it must
 * never be undefined.
 */

import { KeyboardAvoidingView, Text } from 'react-native';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';

describe('KeyboardAvoider', () => {
  it('renders its children', () => {
    const { root } = renderComponent(
      <KeyboardAvoider>
        <Text>form body</Text>
      </KeyboardAvoider>,
    );

    expect(textContent(root)).toContain('form body');
  });

  it('pins behavior="padding" on the underlying KeyboardAvoidingView', () => {
    const { root } = renderComponent(
      <KeyboardAvoider>
        <Text>form body</Text>
      </KeyboardAvoider>,
    );

    const avoidingView = root.findByType(KeyboardAvoidingView);

    expect(avoidingView.props['behavior']).toBe('padding');
  });

  it('passes style and keyboardVerticalOffset through to KeyboardAvoidingView', () => {
    const style = { flex: 1 };

    const { root } = renderComponent(
      <KeyboardAvoider style={style} keyboardVerticalOffset={64}>
        <Text>form body</Text>
      </KeyboardAvoider>,
    );

    const avoidingView = root.findByType(KeyboardAvoidingView);

    expect(avoidingView.props['style']).toBe(style);
    expect(avoidingView.props['keyboardVerticalOffset']).toBe(64);
  });
});
