import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { ApplicationStores } from '@application/di/application-stores';
import { StoreStatus } from '@application/store/store-status';
import { useEditProfile } from '@presentation/app/edit-profile/hooks/use-edit-profile';
import type { UseEditProfileResult } from '@presentation/app/edit-profile/model/use-edit-profile-result';

const mockBack = jest.fn();
jest.mock('@presentation/base/hooks/navigation/use-leave-guard', () => ({
  useLeaveGuard: () => ({ release: jest.fn() }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('@presentation/base/hooks/profile/use-avatar-upload', () => ({
  useAvatarUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false, uploadError: null, onDismissUploadError: jest.fn() }),
}));

const mount = (): { latest: () => UseEditProfileResult } => {
  const authStore = ((selector: (state: unknown) => unknown) =>
    selector({
      state: { status: StoreStatus.Authenticated, session: { user: { displayName: 'Ali', bio: 'eski', photoUrl: null } } },
      updateProfile: jest.fn(async () => null),
    })) as unknown as ApplicationStores['authStore'];
  const box: { vm: UseEditProfileResult | null } = { vm: null };
  const Probe = (): null => {
    box.vm = useEditProfile();
    return null;
  };
  renderComponent(
    <StoresProvider value={{ authStore } as unknown as ApplicationStores}>
      <Probe />
    </StoresProvider>,
  );
  return {
    latest: () => {
      if (box.vm === null) throw new Error('the hook did not run');
      return box.vm;
    },
  };
};

/**
 * Reported as: "I edited my bio, tapped back, and it was gone." Back left Edit
 * Profile at once even with unsaved changes; it now asks Discard / Keep editing.
 */
describe('useEditProfile — leaving with unsaved changes', () => {
  beforeEach(() => mockBack.mockClear());

  it('leaves at once when nothing changed', () => {
    const { latest } = mount();
    act(() => latest().onBack());
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('asks before dropping an edit, and leaves only on Discard', () => {
    const { latest } = mount();
    act(() => latest().onChangeBio('yeni'));

    act(() => latest().onBack());
    expect(mockBack).not.toHaveBeenCalled();
    expect(latest().discardVisible).toBe(true);

    act(() => latest().onKeepEditing());
    expect(latest().discardVisible).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();

    act(() => latest().onBack());
    act(() => latest().onConfirmDiscard());
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
