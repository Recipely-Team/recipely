import { useCallback, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { MediaType } from '@domain/recipes/media/media-type';
import { ValueConstants } from '@core/constants';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import { PickSource } from '@presentation/base/utils/pick-source';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import { t } from '@presentation/i18n';

// No `quality` on purpose: `shrinkForUpload` owns the one re-encode.
const LIBRARY_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsMultipleSelection: true,
  mediaTypes: 'images',
};
const CAMERA_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images' };

const tellPermissionDenied = (): void => {
  Alert.alert(t().recipes.photoPermissionDenied, undefined, [
    { text: t().common.cancel, style: 'cancel' },
    {
      text: t().common.openSettings,
      onPress: () => void Linking.openSettings().catch(() => undefined),
    },
  ]);
};

/**
 * The editor's "add photos" action: camera or library, then shrunk, then handed
 * to `onAdd`.
 *
 * @remarks
 * - **The camera was missing.** The editor opened the library and nothing else,
 *   so a dish on the counter had to be photographed in the camera app first.
 *   The source question is the same `askPickSource` the avatar uses.
 * - **Shrunk before the draft sees it**, so the URI autosave keeps is the one
 *   that will be uploaded, and the preview shows the file that gets sent.
 * - **A refused permission says so, and leads to Settings.** The picker used
 *   to return nothing, which read as a dead button; once iOS has been answered
 *   it never asks again, so the way back is the Settings app.
 * - **A picker or re-encode that throws is said out loud**, not left as an
 *   unhandled rejection behind a button that did nothing.
 * - **One flight at a time.** A second tap while the sheet or the re-encode is
 *   in flight is ignored rather than stacking a second picker.
 */
export const useMediaPick = (onAdd: (items: MediaItem[]) => void): (() => Promise<void>) => {
  const busy = useRef(false);

  return useCallback(async (): Promise<void> => {
    if (busy.current) return;
    busy.current = true;
    try {
      const source = await askPickSource(t().mediaPicker.add);
      if (source === null) return;

      const isCamera = source === PickSource.Camera;
      const permission = isCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        tellPermissionDenied();
        return;
      }

      const result = isCamera
        ? await ImagePicker.launchCameraAsync(CAMERA_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(LIBRARY_OPTIONS);
      if (result.canceled) return;

      const shrunk = await Promise.all(
        result.assets.map((a) => shrinkForUpload({ uri: a.uri, width: a.width, height: a.height })),
      );
      if (shrunk.length > ValueConstants.zero) {
        onAdd(shrunk.map((url) => ({ type: MediaType.Image, url })));
      }
    } catch {
      Alert.alert(t().recipes.photoAddFailed);
    } finally {
      busy.current = false;
    }
  }, [onAdd]);
};
