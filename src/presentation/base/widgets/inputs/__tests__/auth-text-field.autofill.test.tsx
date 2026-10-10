import { TextInput } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AuthTextField } from '@presentation/base/widgets/inputs/auth-text-field';
import { AuthAutofill } from '@presentation/base/widgets/inputs/auth-autofill';

/**
 * Reported as: "the keychain never offers my password." No auth field named
 * its content, so iOS Keychain and Google's password manager stayed silent and
 * sign-up got no strong-password offer.
 */
describe('AuthTextField autofill', () => {
  it.each([
    [AuthAutofill.Email, 'emailAddress'],
    [AuthAutofill.Password, 'password'],
    [AuthAutofill.NewPassword, 'newPassword'],
    [AuthAutofill.Name, 'name'],
  ])('tells the platform the field holds %s', (autofill, textContentType) => {
    const { root } = renderComponent(
      <AuthTextField iconName="mail-outline" placeholder="field" value="" onChangeText={jest.fn()} autofill={autofill} />,
    );
    const input = root.findByType(TextInput);

    expect(input.props.autoComplete).toBe(autofill);
    expect(input.props.textContentType).toBe(textContentType);
  });
});
