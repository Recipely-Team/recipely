import { useRef, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { useAvatarUpload } from '@presentation/base/hooks/profile/use-avatar-upload';
import { t } from '@presentation/i18n';
import { BIO_MAX } from '@presentation/app/edit-profile/model/edit-profile-limits';
import type { UseEditProfileResult } from '@presentation/app/edit-profile/model/use-edit-profile-result';
import {
  EditProfileSaveOutcome,
  type EditProfileSaveOutcomeType,
} from '@presentation/app/edit-profile/model/edit-profile-save-outcome';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Orchestrates the edit-profile form: seeds the display name / bio from the
 * signed-in user, tracks dirty/validity state, uploads a new avatar, and saves
 * the profile — navigating back on success, surfacing any save or avatar
 * failure through the `errorDialog` the screen renders as a dialog.
 *
 * @remarks
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
  const router = useRouter();
  const { pickAndUpload, isUploading, uploadError, onDismissUploadError } = useAvatarUpload();

  const { authStore } = useStores();
  const authState = authStore((s) => s.state);
  const updateProfile = authStore((s) => s.updateProfile);

  const user = authState.status === StoreStatus.Authenticated ? authState.session.user : null;
  const initialDisplayName = user?.displayName ?? CharConstants.empty;
  const initialBio = user?.bio ?? CharConstants.empty;
  const photoUri = user?.photoUrl ?? undefined;

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  // The write-through copy the save reads. Updated by the setters below rather
  // than during render, because a render is exactly what has not happened yet.
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

  const canSave = displayName.trim().length > ValueConstants.zero;
  const dirty = displayName !== initialDisplayName || bio !== initialBio;
  const showNameError = dirty && !canSave;
  const bioAtLimit = bio.length >= BIO_MAX;
  const saveEnabled = canSave && dirty && !isSaving;

  const onSave = async (): Promise<EditProfileSaveOutcomeType> => {
    const { displayName: name, bio: about } = latest.current;
    if (isSaving) return EditProfileSaveOutcome.Busy;
    if (name.trim().length === ValueConstants.zero) return EditProfileSaveOutcome.NameRequired;
    if (name === initialDisplayName && about === initialBio) return EditProfileSaveOutcome.Unchanged;

    setIsSaving(true);
    try {
      const failure = await updateProfile({ displayName: name.trim(), bio: about.trim() });
      if (failure !== null) {
        setSaveError(failureKeyMessage(failure) ?? failureToastMessage(failure));
        return EditProfileSaveOutcome.Failed;
      }
      showSuccessToast(t().editProfile.saved);
      router.back();
      return EditProfileSaveOutcome.Saved;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    displayName,
    onChangeName,
    bio,
    onChangeBio,
    photoUri,
    isUploading,
    onPickAvatar: () => void pickAndUpload(),
    showNameError,
    bioAtLimit,
    saveEnabled,
    isDirty: dirty,
    isSaving,
    onSave,
    onBack: () => router.back(),
    errorDialog: saveError ?? uploadError,
    onCloseErrorDialog: () => {
      setSaveError(null);
      onDismissUploadError();
    },
  };
};
