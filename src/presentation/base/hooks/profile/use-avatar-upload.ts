import { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage } from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';
import type { AvatarUpload } from '@presentation/base/hooks/profile/avatar-upload';
import { PickSource } from '@presentation/base/hooks/profile/pick-source';
import { ValueConstants } from '@core/constants';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

/** Derives a multipart-friendly `fileName`/`mimeType` from a picked asset uri. */
const toUploadMeta = (uri: string): { fileName: string; mimeType: string } => {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const safeExt = ext.length > ValueConstants.zero && ext.length <= 4 ? ext : 'jpg';
  return {
    fileName: `avatar-${Date.now()}.${safeExt}`,
    mimeType: MIME_BY_EXT[safeExt] ?? 'image/jpeg',
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

      const { fileName, mimeType } = toUploadMeta(asset.uri);
      setIsUploading(true);
      try {
        const failure = await uploadAvatar(asset.uri, fileName, mimeType);
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

    if (Platform.OS === 'web') {
      await launch(PickSource.Library);
      return;
    }

    if (Platform.OS === 'ios') {
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
