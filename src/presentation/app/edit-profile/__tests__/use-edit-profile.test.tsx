import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { StoreStatus } from '@application/store/store-status';
import { useEditProfile } from '@presentation/app/edit-profile/hooks/use-edit-profile';
import { EditProfileSaveOutcome } from '@presentation/app/edit-profile/model/edit-profile-save-outcome';
import type { UseEditProfileResult } from '@presentation/app/edit-profile/model/use-edit-profile-result';

/**
 * The assistant writes a field and says "kaydet" in the same breath. Those
 * arrive as two tool calls in ONE model turn and run back to back, before
 * React has re-rendered — so a save that read the render's `displayName` saw
 * the value from before the write. It saved the old name, or decided nothing
 * had changed, and reported success either way.
 *
 * The test acts that out deliberately: both calls come from the SAME captured
 * render, with no render in between.
 */

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

jest.mock('@presentation/base/hooks/profile/use-avatar-upload', () => ({
  useAvatarUpload: () => ({
    pickAndUpload: jest.fn(),
    isUploading: false,
    uploadError: null,
    onDismissUploadError: jest.fn(),
  }),
}));

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
}));

const INITIAL_NAME = 'Ali';

function harness(updateProfile: jest.Mock) {
  const authStore = ((selector: (state: unknown) => unknown) =>
    selector({
      state: {
        status: StoreStatus.Authenticated,
        session: { user: { displayName: INITIAL_NAME, bio: 'eski', photoUrl: null } },
      },
      updateProfile,
    })) as unknown as Stores['authStore'];

  const captured: { vm: UseEditProfileResult | null } = { vm: null };
  const Probe = (): null => {
    captured.vm = useEditProfile();
    return null;
  };

  renderComponent(
    <StoresProvider value={{ authStore } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  const vm = captured.vm;
  if (vm === null) throw new Error('the hook did not run');
  return { vm, captured };
}

describe('useEditProfile — saving what was just written', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('saves the name written moments earlier, in the same turn', async () => {
    const updateProfile = jest.fn(async () => null);
    const { vm } = harness(updateProfile);

    let outcome;
    await act(async () => {
      // No render between these two: this is the assistant's turn, not a user
      // typing and then reaching for the button.
      vm.onChangeName('Veli');
      outcome = await vm.onSave();
    });

    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Veli' }));
    expect(outcome).toBe(EditProfileSaveOutcome.Saved);
  });

  it('says there was nothing to save rather than saving nothing', async () => {
    const updateProfile = jest.fn(async () => null);
    const { vm } = harness(updateProfile);

    let outcome;
    await act(async () => {
      outcome = await vm.onSave();
    });

    expect(outcome).toBe(EditProfileSaveOutcome.Unchanged);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  // The header button is merely disabled; the assistant needs the reason, and
  // it has to be the real one rather than a flag read from a stale render.
  it('refuses to save an emptied name, and says which', async () => {
    const updateProfile = jest.fn(async () => null);
    const { vm } = harness(updateProfile);

    let outcome;
    await act(async () => {
      vm.onChangeName('   ');
      outcome = await vm.onSave();
    });

    expect(outcome).toBe(EditProfileSaveOutcome.NameRequired);
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
