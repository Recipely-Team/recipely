import { useCallback, useState } from 'react';
import {
  MIME_BY_EXTENSION,
  DEFAULT_IMAGE_MIME,
} from '@infrastructure/constants/image-mime';
import { isIos, isWeb } from '@infrastructure/constants/platform';
import { ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage } from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import { AVATAR_UPLOAD_MAX_EDGE } from '@infrastructure/constants/media-upload';
import type { AvatarUpload } from '@presentation/base/hooks/profile/avatar-upload';
import { PickSource } from '@presentation/base/hooks/profile/pick-source';
import { ValueConstants } from '@core/constants';

// No `quality` here on purpose: `shrinkForUpload` owns the one re-encode, the
// same way the recipe media picker leaves it to do.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
};

/** Derives a multipart-friendly `fileName`/`mimeType` from a picked asset uri. */
const toUploadMeta = (uri: string): { fileName: string; mimeType: string } => {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const safeExt = ext.length > ValueConstants.zero && ext.length <= 4 ? ext : 'jpg';
  return {
    fileName: `avatar-${Date.now()}.${safeExt}`,
    mimeType: MIME_BY_EXTENSION[safeExt] ?? DEFAULT_IMAGE_MIME,
  };
};

/**
 * Drives the "change profile photo" flow: source choice (camera vs. library),
 * permission checks, the image picker, and the auth-store `uploadAvatar` call.
 * Surfaces every failure through `uploadError`, which the owning screen shows
 * as a dialog — a toast can be missed, and the user must never get a silent
 * dead end. On web the camera option is skipped (unreliable there) and the
 * library opens directly. The avatar re-renders from the session the store
 * updates.
 */
export const useAvatarUpload = (): AvatarUpload => {
  const { authStore } = useStores();
  const uploadAvatar = authStore((s) => s.uploadAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const launch = useCallback(
    async (source: PickSource): Promise<void> => {
      const perm =
        source === PickSource.Camera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setUploadError(t().profile.photoPermissionDenied);
        return;
      }

      const result =
        source === PickSource.Camera
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = result.canceled ? undefined : result.assets[ValueConstants.zero];
      if (asset === undefined) return;

      // Busy from the moment there is a photo, not from the moment it is sent.
      // Shrinking a 4000px capture is a real pass over the image, and it used
      // to sit outside this flag: the screen showed no spinner, the button
      // stayed enabled, and `pickAndUpload`'s own `if (isUploading) return`
      // could not fire — so a second tap during the re-encode started a whole
      // second flight, and whichever upload finished last won.
      setIsUploading(true);
      try {
        // Shrunk before it is sent, not after it is refused. The picker hands
        // back the original capture — several megabytes at 4000px on a recent
        // phone — for a picture the server renders at 256 square. The recipe
        // photo path has done this since the day the same upload failed there;
        // this one was never brought along, so a photo over the proxy's cap
        // came back as an error the user could do nothing about.
        const uri = await shrinkForUpload(
          { uri: asset.uri, width: asset.width, height: asset.height },
          AVATAR_UPLOAD_MAX_EDGE,
        );
        const { fileName, mimeType } = toUploadMeta(uri);
        const failure = await uploadAvatar(uri, fileName, mimeType);
        if (failure !== null) {
          // Prefer the precise catalogue copy (e.g. "only images … can be
          // uploaded") over the generic screen fallback; both are localized.
          setUploadError(failureKeyMessage(failure) ?? t().profile.photoUploadFailed);
          return;
        }
        showSuccessToast(t().profile.photoUploadSuccess);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadAvatar],
  );

  const pickAndUpload = useCallback(async (): Promise<void> => {
    if (isUploading) return;

    if (isWeb()) {
      await launch(PickSource.Library);
      return;
    }

    if (isIos()) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t().profile.changePhoto,
          options: [
            t().profile.takePhoto,
            t().profile.chooseFromLibrary,
            t().common.cancel,
          ],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === ValueConstants.zero) void launch(PickSource.Camera);
          else if (index === 1) void launch(PickSource.Library);
        },
      );
      return;
    }

    Alert.alert(t().profile.changePhoto, undefined, [
      { text: t().profile.takePhoto, onPress: () => void launch(PickSource.Camera) },
      { text: t().profile.chooseFromLibrary, onPress: () => void launch(PickSource.Library) },
      { text: t().common.cancel, style: 'cancel' },
    ]);
  }, [isUploading, launch]);

  return {
    pickAndUpload,
    isUploading,
    uploadError,
    onDismissUploadError: () => setUploadError(null),
  };
};
