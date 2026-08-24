import type { EditProfileSaveOutcomeType } from '@presentation/app/edit-profile/model/edit-profile-save-outcome';

/** View model returned by {@link useEditProfile} for the edit-profile screen. */
export interface UseEditProfileResult {
  displayName: string;
  onChangeName: (value: string) => void;
  bio: string;
  onChangeBio: (value: string) => void;
  photoUri: string | undefined;
  isUploading: boolean;
  onPickAvatar: () => void;
  showNameError: boolean;
  bioAtLimit: boolean;
  saveEnabled: boolean;
  /** True while the form differs from the signed-in profile — what "unsaved" means. */
  isDirty: boolean;
  isSaving: boolean;
  /** Saves, and says what it did — the header ignores the answer, the assistant reads it. */
  onSave: () => Promise<EditProfileSaveOutcomeType>;
  onBack: () => void;
  /** Localized message for the save/avatar failure dialog; null when there is none. */
  errorDialog: string | null;
  onCloseErrorDialog: () => void;
}
