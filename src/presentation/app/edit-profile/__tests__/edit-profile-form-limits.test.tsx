/**
 * EditProfileForm — display-name length cap.
 *
 * Regression: the name input had no `maxLength`, so a user could type past the
 * server's limit and only find out at save time, as a bare 400 dialog. The cap
 * must stay tied to DISPLAY_NAME_MAX, which mirrors the backend's
 * DisplayNameSchema.
 */

import { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { EditProfileForm } from '@presentation/app/edit-profile/body/edit-profile-form';
import { DISPLAY_NAME_MAX } from '@presentation/base/forms/display-name-limits';
import { BIO_MAX } from '@presentation/app/edit-profile/model/edit-profile-limits';
import { t } from '@presentation/i18n';

describe('EditProfileForm — input length caps', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('caps the display-name input at DISPLAY_NAME_MAX and the bio at BIO_MAX', async () => {
    const tree = await renderComponent(
      <EditProfileForm
        displayName="Recep"
        onChangeName={jest.fn()}
        showNameError={false}
        bio=""
        onChangeBio={jest.fn()}
        bioAtLimit={false}
      />,
    );

    // Bind each cap to its own field: asserting the set of maxLengths would
    // still pass if the two inputs had their caps swapped.
    const capFor = (placeholder: string): unknown =>
      tree.root
        .findAllByType(TextInput)
        .find((input) => input.props['placeholder'] === placeholder)?.props['maxLength'];

    expect(capFor(t().editProfile.displayNamePlaceholder)).toBe(DISPLAY_NAME_MAX);
    expect(capFor(t().editProfile.bioPlaceholder)).toBe(BIO_MAX);
  });
});
