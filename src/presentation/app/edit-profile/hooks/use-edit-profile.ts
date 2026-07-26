import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { useAvatarUpload } from '@presentation/base/hooks/profile/use-avatar-upload';
import { t } from '@presentation/i18n';
import { BIO_MAX } from '@presentation/app/edit-profile/model/edit-profile-limits';
import type { UseEditProfileResult } from '@presentation/app/edit-profile/model/use-edit-profile-result';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Orchestrates the edit-profile form: seeds the display name / bio from the
 * signed-in user, tracks dirty/validity state, uploads a new avatar, and saves
 * the profile — navigating back on success, surfacing any save or avatar
 * failure through the `errorDialog` the screen renders as a dialog.
 */
export const useEditProfile = (): UseEditProfileResult => {
  const router = useRouter();
  const { pickAndUpload, isUploading, uploadError, onDismissUploadError } = useAvatarUpload();

  const { authStore } = useStores();
  const authState = authStore((s) => s.state);
  const updateProfile = authStore((s) => s.updateProfile);

  const user = authState.status === 'authenticated' ? authState.session.user : null;
  const initialDisplayName = user?.displayName ?? CharConstants.empty;
  const initialBio = user?.bio ?? CharConstants.empty;
  const photoUri = user?.photoUrl ?? undefined;

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = displayName.trim().length > ValueConstants.zero;
  const dirty = displayName !== initialDisplayName || bio !== initialBio;
  const showNameError = dirty && !canSave;
  const bioAtLimit = bio.length >= BIO_MAX;
  const saveEnabled = canSave && dirty && !isSaving;

  const onSave = async (): Promise<void> => {
    if (!canSave || !dirty || isSaving) return;
    setIsSaving(true);
    try {
      const failure = await updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
      if (failure !== null) {
        setSaveError(failureKeyMessage(failure) ?? failureToastMessage(failure));
        return;
      }
      showSuccessToast(t().editProfile.saved);
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    displayName,
    onChangeName: setDisplayName,
    bio,
    onChangeBio: setBio,
    photoUri,
    isUploading,
    onPickAvatar: () => void pickAndUpload(),
    showNameError,
    bioAtLimit,
    saveEnabled,
    isSaving,
    onSave: () => void onSave(),
    onBack: () => router.back(),
    errorDialog: saveError ?? uploadError,
    onCloseErrorDialog: () => {
      setSaveError(null);
      onDismissUploadError();
    },
  };
};
