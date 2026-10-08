/**
 * The one text field the four auth forms share: a password field owns its own
 * show/hide toggle, and the validity mark only appears once there is
 * something to judge.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AuthTextField } from '@presentation/base/widgets/inputs/auth-text-field';

const buttons = (root: ReactTestInstance): ReactTestInstance[] =>
  root.findAll((node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');

const iconNames = (root: ReturnType<typeof renderComponent>['root']): string[] =>
  root.findAllByType(Ionicons).map((icon) => String(icon.props.name));

describe('AuthTextField', () => {
  it('hides a password until the eye toggle is pressed', () => {
    const { root } = renderComponent(
      <AuthTextField iconName="lock-closed-outline" placeholder="p" value="secret" onChangeText={jest.fn()} password />,
    );

    expect(root.findByType(TextInput).props.secureTextEntry).toBe(true);
    act(() => {
      (buttons(root)[0].props.onPress as () => void)();
    });
    expect(root.findByType(TextInput).props.secureTextEntry).toBe(false);
    expect(iconNames(root)).toContain('eye-off-outline');
  });

  it('shows no toggle and no validity mark on a plain field', () => {
    const { root } = renderComponent(
      <AuthTextField iconName="mail-outline" placeholder="e" value="" onChangeText={jest.fn()} />,
    );

    expect(root.findByType(TextInput).props.secureTextEntry).toBe(false);
    expect(buttons(root)).toHaveLength(0);
    expect(iconNames(root)).toEqual(['mail-outline']);
  });

  it('marks a valid value with a check and an invalid one with a cross', () => {
    const valid = renderComponent(
      <AuthTextField iconName="mail-outline" placeholder="e" value="a@b.co" onChangeText={jest.fn()} valid />,
    );
    const invalid = renderComponent(
      <AuthTextField iconName="mail-outline" placeholder="e" value="a@" onChangeText={jest.fn()} valid={false} />,
    );

    expect(iconNames(valid.root)).toContain('checkmark-circle');
    expect(iconNames(invalid.root)).toContain('close-circle');
  });
});
