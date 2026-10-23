import { useCallback, useState } from 'react';
import { useStore } from 'zustand';
import * as ImagePicker from 'expo-image-picker';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage } from '@presentation/base/errors/failure-lookups';
import { useTranslations } from '@presentation/i18n';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import { AVATAR_UPLOAD_MAX_EDGE } from '@infrastructure/constants/media-upload';
import type { AvatarUpload } from '@presentation/base/hooks/profile/avatar-upload';
import { PickSource } from '@presentation/base/utils/pick-source';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import { ValueConstants } from '@core/constants';
import { uploadFileMeta } from '@presentation/base/utils/upload-file-meta';

// No `quality` here on purpose: `shrinkForUpload` owns the one re-encode, the
// same way the recipe media picker leaves it to do.
const AVATAR_FILE_PREFIX = 'avatar';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [ValueConstants.one, ValueConstants.one],
};

/**
 * Drives the "change profile photo" flow: source choice (camera vs. library),
 * permission checks, the image picker, and the auth-store `uploadAvatar` call.
 * Surfaces every failure through `uploadError`, which the owning screen shows
 * as a dialog — a toast can be missed, and the user must never get a silent
 * dead end — a throw anywhere after the pick (reading the file, building the
 * request) lands there too. The camera-or-library question is `askPickSource`'s, which skips
 * it on web. The avatar re-renders from the session the store updates.
 */
export const useAvatarUpload = (): AvatarUpload => {
  const t = useTranslations();
  const { authStore } = useStores();
  const uploadAvatar = useStore(authStore, (s) => s.uploadAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const launch = useCallback(
    async (source: PickSource): Promise<void> => {
      const perm =
        source === PickSource.Camera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setUploadError(t.profile.photoPermissionDenied);
        return;
      }

      const result =
        source === PickSource.Camera
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = result.canceled ? undefined : result.assets[ValueConstants.zero];
      if (asset === undefined) return;

      // Busy from the moment a photo exists: shrinking is real work.
      setIsUploading(true);
      const upload = async (): Promise<void> => {
        // Shrink before sending; the server renders 256 square.
        const uri = await shrinkForUpload(
          { uri: asset.uri, width: asset.width, height: asset.height },
          AVATAR_UPLOAD_MAX_EDGE,
        );
        const { fileName, mimeType } = uploadFileMeta(uri, AVATAR_FILE_PREFIX, String(Date.now()));
        const failure = await uploadAvatar(uri, fileName, mimeType);
        if (failure !== null) {
          setUploadError(failureKeyMessage(t, failure) ?? t.profile.photoUploadFailed);
          return;
        }
        showSuccessToast(t.profile.photoUploadSuccess);
      };
      // A throw before the request (reading the photo) is a failed upload too, never silence.
      await upload()
        .catch(() => setUploadError(t.profile.photoUploadFailed))
        .finally(() => setIsUploading(false));
    },
    [uploadAvatar, t],
  );

  const pickAndUpload = useCallback(async (): Promise<void> => {
    if (isUploading) return;
    const source = await askPickSource(t.profile.changePhoto);
    if (source !== null) await launch(source);
  }, [isUploading, launch, t]);

  return {
    pickAndUpload,
    isUploading,
    uploadError,
    onDismissUploadError: () => setUploadError(null),
  };
};
