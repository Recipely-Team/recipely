/**
 * EditProfileScreen — KeyboardAvoider wiring.
 *
 * Regression for the "big blank band above the keyboard" bug: the screen used
 * to pass `keyboardVerticalOffset={insets.top + spacing.xxl}` to its
 * KeyboardAvoider. KeyboardAvoidingView already measures its own frame (which
 * sits below the header inside the full-screen root), so any extra offset is
 * double-counted and shows up as a same-sized empty gap between the focused
 * bio input and the keyboard.
 */

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { EditProfileScreen } from '@presentation/app/edit-profile';
import type { UseEditProfileResult } from '@presentation/app/edit-profile/model/use-edit-profile-result';
import { EditProfileSaveOutcome } from '@presentation/app/edit-profile/model/edit-profile-save-outcome';

const mockVm: UseEditProfileResult = {
  displayName: 'E2E Test',
  onChangeName: jest.fn(),
  bio: '',
  onChangeBio: jest.fn(),
  photoUri: undefined,
  isUploading: false,
  onPickAvatar: jest.fn(),
  showNameError: false,
  bioAtLimit: false,
  saveEnabled: false,
  isDirty: false,
  isSaving: false,
  onSave: jest.fn(async () => EditProfileSaveOutcome.Unchanged),
  onBack: jest.fn(),
  errorDialog: null,
  onCloseErrorDialog: jest.fn(),
};

// This suite renders the screen bare, without a StoresProvider — it is about
// keyboard avoidance, not wiring. The assistant hook only registers actions,
// so stubbing it keeps that focus rather than dragging a store container in.
jest.mock('@presentation/app/edit-profile/hooks/use-assistant-profile-actions', () => ({
  useAssistantProfileActions: (): void => {},
}));

jest.mock('@presentation/app/edit-profile/hooks/use-edit-profile', () => ({
  useEditProfile: (): UseEditProfileResult => mockVm,
}));

describe('EditProfileScreen — keyboard avoidance', () => {
  // AppThemeProvider hydrates theme/preference from async storage on mount; let
  // those promises settle inside act so a late re-render can't fire after the
  // test body finished.
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('passes no keyboardVerticalOffset to the KeyboardAvoider', () => {
    const { root } = renderComponent(<EditProfileScreen />);

    // The avoider's own layout already sits below the header, so any offset is
    // double-counted and becomes a blank band above the keyboard.
    const avoider = root.findByType(KeyboardAvoider);
    expect(avoider.props.keyboardVerticalOffset).toBeUndefined();
  });
});
