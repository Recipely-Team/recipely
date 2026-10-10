import { useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ValueConstants } from '@core/constants';
import type { FridgePhoto } from '@domain/fridge/scan/fridge-photo';
import { PickSource } from '@presentation/base/utils/pick-source';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import { uploadFileMeta } from '@presentation/base/utils/upload-file-meta';
import { PhotoPickFeedback } from '@presentation/base/feedback/photo-pick-feedback';

const FRIDGE_FILE_PREFIX = 'fridge';
const CAMERA_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images' };

/**
 * Camera or library → shrunk local photos for the fridge scan, at most `room`.
 *
 * @remarks
 * - **The diary's meal-photo path, for up to three**: the same picker,
 *   permission prompts, `shrinkForUpload` (long edge 1600 px, JPEG) and
 *   `uploadFileMeta`; the library allows several at once (`selectionLimit`).
 * - **A refused permission says so and offers Settings** (`PhotoPickFeedback`);
 *   the other source stays available.
 * - **Nothing leaves the device here** — the photos wait in the screen until
 *   "Find ingredients".
 * - **One picker at a time**: a second tap while one is open does nothing.
 */
export const useFridgePhotoPick = (): ((source: PickSource, room: number) => Promise<FridgePhoto[]>) => {
  const busy = useRef(false);
  return useCallback(async (source: PickSource, room: number): Promise<FridgePhoto[]> => {
    if (busy.current || room <= ValueConstants.zero) return [];
    busy.current = true;
    try {
      const camera = source === PickSource.Camera;
      const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        PhotoPickFeedback.permissionDenied();
        return [];
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync(CAMERA_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: room > ValueConstants.one, orderedSelection: true, selectionLimit: room });
      if (result.canceled) return [];
      const stamp = String(Date.now());
      const picked = result.assets.slice(ValueConstants.zero, room);
      const uris = await Promise.all(picked.map((asset) => shrinkForUpload({ uri: asset.uri, width: asset.width, height: asset.height })));
      return uris.map((uri, index) => ({ uri, ...uploadFileMeta(uri, FRIDGE_FILE_PREFIX, `${stamp}-${index}`) }));
    } catch {
      PhotoPickFeedback.failed();
      return [];
    } finally {
      busy.current = false;
    }
  }, []);
};
