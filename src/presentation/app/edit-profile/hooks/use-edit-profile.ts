import { useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useLeaveGuard } from '@presentation/base/hooks/navigation/use-leave-guard';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { RoutePaths } from '@presentation/base/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { useAvatarUpload } from '@presentation/base/hooks/profile/use-avatar-upload';
import { useTranslations } from '@presentation/i18n';
import { BIO_MAX } from '@presentation/app/edit-profile/model/edit-profile-limits';
import type { UseEditProfileResult } from '@presentation/app/edit-profile/model/use-edit-profile-result';
import {
  EditProfileSaveOutcome,
  type EditProfileSaveOutcomeType,
} from '@presentation/app/edit-profile/model/edit-profile-save-outcome';
import { CharConstants } from '@core/constants';
import { isBlank } from '@core/guards/type-guards';
import { useSignedInUser } from '@presentation/base/hooks/auth/use-signed-in-user';

/**
 * Orchestrates the edit-profile form: seeds the display name / bio from the
 * signed-in user, tracks dirty/validity state, uploads a new avatar, and saves
 * the profile — navigating back on success, surfacing any save or avatar
 * failure through the `errorDialog` the screen renders as a dialog.
 *
 * @remarks
 * - **Back asks before dropping an edit.** With unsaved changes it opens a
 *   Discard / Keep editing sheet; it used to throw the edited bio away silently.
 * - **Save reads the fields through a ref, not this render.** The assistant
 *   can write a field and say "save" in the same turn; both tool calls run
 *   before React re-renders, so the render's `displayName` is the one from
 *   before the change — it would have saved the old name and said it was done.
 *   The ref is written by the change handlers themselves, which is the only
 *   moment that is not too late.
 * - **It answers what it did.** The button reads `saveEnabled` and is simply
 *   disabled; the assistant needs the reason, and a reason derived from the
 *   same stale render would be wrong in the same way.
 */
export const useEditProfile = (): UseEditProfileResult => {
  const t = useTranslations();
  const goBack = useGoBackOrHome(RoutePaths.profile);
  const { pickAndUpload, isUploading, uploadError, onDismissUploadError } = useAvatarUpload();

  const { authStore } = useStores();
  const updateProfile = useStore(authStore, (s) => s.updateProfile);

  const user = useSignedInUser();
  const initialDisplayName = user?.displayName ?? CharConstants.empty;
  const initialBio = user?.bio ?? CharConstants.empty;
  const photoUri = user?.photoUrl ?? undefined;

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  // Write-through copy for save, updated in the setters (not in render).
  const latest = useRef({ displayName: initialDisplayName, bio: initialBio });

  const onChangeName = (value: string): void => {
    latest.current.displayName = value;
    setDisplayName(value);
  };
  const onChangeBio = (value: string): void => {
    latest.current.bio = value;
    setBio(value);
  };
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDiscardVisible, setDiscardVisible] = useState(false);

  const canSave = !isBlank(displayName);
  const isDirty = displayName !== initialDisplayName || bio !== initialBio;
  const shouldShowNameError = isDirty && !canSave;
  // The back gesture asks too; off while saving, so the save's own way back is not held.
  const heldBack = useRef(false);
  const leaveGuard = useLeaveGuard(isDirty && !isSaving, () => {
    heldBack.current = true;
    setDiscardVisible(true);
  });
  const isBioAtLimit = bio.length >= BIO_MAX;
  const isSaveEnabled = canSave && isDirty && !isSaving;

  const onSave = async (): Promise<EditProfileSaveOutcomeType> => {
    const { displayName: name, bio: about } = latest.current;
    if (isSaving) return EditProfileSaveOutcome.Busy;
    if (isBlank(name)) return EditProfileSaveOutcome.NameRequired;
    if (name === initialDisplayName && about === initialBio) return EditProfileSaveOutcome.Unchanged;

    setIsSaving(true);
    const failure = await updateProfile({ displayName: name.trim(), bio: about.trim() }).finally(() => setIsSaving(false));
    if (failure !== null) {
      setSaveError(failureKeyMessage(t, failure) ?? failureToastMessage(t, failure));
      return EditProfileSaveOutcome.Failed;
    }
    showSuccessToast(t.editProfile.saved);
    goBack();
    return EditProfileSaveOutcome.Saved;
  };

  return {
    displayName,
    onChangeName,
    bio,
    onChangeBio,
    photoUri,
    isUploading,
    onPickAvatar: () => void pickAndUpload(),
    showNameError: shouldShowNameError,
    bioAtLimit: isBioAtLimit,
    saveEnabled: isSaveEnabled,
    isDirty: isDirty,
    isSaving,
    onSave,
    onBack: () => (isDirty ? setDiscardVisible(true) : goBack()),
    discardVisible: isDiscardVisible,
    onConfirmDiscard: () => {
      setDiscardVisible(false);
      if (heldBack.current) leaveGuard.release();
      else goBack();
    },
    onKeepEditing: () => {
      heldBack.current = false;
      setDiscardVisible(false);
    },
    errorDialog: saveError ?? uploadError,
    onCloseErrorDialog: () => {
      setSaveError(null);
      onDismissUploadError();
    },
  };
};
