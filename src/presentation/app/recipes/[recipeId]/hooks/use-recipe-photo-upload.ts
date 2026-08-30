import { ActionSheetIOS, Alert } from 'react-native';
import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { DEFAULT_IMAGE_MIME, MIME_BY_EXTENSION } from '@infrastructure/constants/image-mime';
import { isIos, isWeb } from '@infrastructure/constants/platform';
import { failureKeyMessage } from '@presentation/base/errors/failure-lookups';
import { PickSource } from '@presentation/base/hooks/profile/pick-source';
import type { RecipePhotoUpload } from '@presentation/app/recipes/[recipeId]/model/recipe-photo-upload';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ValueConstants } from '@core/constants';

/**
 * No `allowsEditing`, unlike the avatar.
 *
 * An avatar is cropped to a circle, so the square crop step earns itself. A
 * recipe photo is shown at the picture's own shape, and forcing a crop on the
 * way in would ask the cook to throw away the edges of a dish they framed.
 */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  quality: 0.85,
};

const FALLBACK_EXTENSION = 'jpg';
const MAX_EXTENSION_LENGTH = 4;

/** A multipart-friendly name and type, derived from the picked asset's uri. */
const toUploadMeta = (uri: string): { fileName: string; mimeType: string } => {
  const ext = uri.split('.').pop()?.toLowerCase() ?? FALLBACK_EXTENSION;
  const safeExt =
    ext.length > ValueConstants.zero && ext.length <= MAX_EXTENSION_LENGTH
      ? ext
      : FALLBACK_EXTENSION;
  return {
    fileName: `recipe-${Date.now()}.${safeExt}`,
    mimeType: MIME_BY_EXTENSION[safeExt] ?? DEFAULT_IMAGE_MIME,
  };
};

/**
 * Adding and removing photos on a recipe the user owns.
 *
 * @remarks
 * - **Why the screen has this at all.** Editing a published recipe was removed,
 *   which left no way to add a photo to one — and the dish looking better than
 *   the picture that went out with it is the ordinary case, not an edge one.
 * - **Every failure reaches a dialog, none is a toast.** The server judges the
 *   photo before it stores it, so "that picture cannot go up" is an answer the
 *   user has to be able to read and act on; a toast that scrolls away is how a
 *   refusal becomes "the button does nothing". Success is a toast, because
 *   success is visible on the screen behind it.
 * - **The catalogue copy wins over the generic line.** A refused photo and a
 *   photo the server could not check are different sentences with different
 *   advice, and both arrive as message keys.
 */
export const useRecipePhotoUpload = (recipeId: string): RecipePhotoUpload => {
  const { recipeDetailStore } = useStores();
  const addPhoto = recipeDetailStore((s) => s.addPhoto);
  const removePhoto = recipeDetailStore((s) => s.removePhoto);
  const isBusy = recipeDetailStore((s) => s.isPhotoBusy);
  const [error, setError] = useState<string | null>(null);

  const launch = useCallback(
    async (source: PickSource): Promise<void> => {
      const permission =
        source === PickSource.Camera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(t().recipes.photoPermissionDenied);
        return;
      }

      const result =
        source === PickSource.Camera
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = result.canceled ? undefined : result.assets[ValueConstants.zero];
      if (asset === undefined) return;

      const { fileName, mimeType } = toUploadMeta(asset.uri);
      const failure = await addPhoto(recipeId, asset.uri, fileName, mimeType);
      if (failure !== null) {
        setError(failureKeyMessage(failure) ?? t().recipes.photoAddFailed);
        return;
      }
      showSuccessToast(t().recipes.photoAdded);
    },
    [addPhoto, recipeId],
  );

  const pickAndAdd = useCallback(async (): Promise<void> => {
    if (isBusy) return;

    // Web has no reliable camera through the picker, so it goes straight to
    // the library — the same call the avatar flow makes, for the same reason.
    if (isWeb()) {
      await launch(PickSource.Library);
      return;
    }

    if (isIos()) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t().recipes.addPhoto,
          options: [t().profile.takePhoto, t().profile.chooseFromLibrary, t().common.cancel],
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === ValueConstants.zero) void launch(PickSource.Camera);
          else if (index === 1) void launch(PickSource.Library);
        },
      );
      return;
    }

    Alert.alert(t().recipes.addPhoto, undefined, [
      { text: t().profile.takePhoto, onPress: () => void launch(PickSource.Camera) },
      { text: t().profile.chooseFromLibrary, onPress: () => void launch(PickSource.Library) },
      { text: t().common.cancel, style: 'cancel' },
    ]);
  }, [isBusy, launch]);

  const remove = useCallback(
    async (mediaId: string): Promise<void> => {
      if (isBusy) return;
      const failure = await removePhoto(recipeId, mediaId);
      if (failure !== null) {
        setError(failureKeyMessage(failure) ?? t().recipes.photoRemoveFailed);
        return;
      }
      showSuccessToast(t().recipes.photoRemoved);
    },
    [isBusy, removePhoto, recipeId],
  );

  return { pickAndAdd, remove, isBusy, error, onDismissError: () => setError(null) };
};
