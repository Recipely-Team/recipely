import { useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { MediaType } from '@domain/recipes/media/media-type';
import { ValueConstants } from '@core/constants';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import { PickSource } from '@presentation/base/utils/pick-source';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import { t } from '@presentation/i18n';
import { photoPickLimits } from '@presentation/app/create-recipe/model/photos/photo-pick-limits';
import { PhotoPickFeedback } from '@presentation/base/feedback/photo-pick-feedback';

/** A picked file the editor takes: a size the picker could not report is given the benefit of the doubt. */
const withinLimit = (asset: ImagePicker.ImagePickerAsset): boolean =>
  asset.fileSize === undefined || asset.fileSize <= photoPickLimits.maxBytes;

// No `quality` on purpose: `shrinkForUpload` owns the one re-encode.
const LIBRARY_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsMultipleSelection: true,
  mediaTypes: 'images',
};
const CAMERA_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images' };

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
 * - **A file over the size cap is skipped, not refused wholesale.** The rest of
 *   the pick goes in, and `onSkip` is told how many stayed out so the grid can
 *   say so; every completed pick reports, so a clean one clears the message.
 */
export const useMediaPick = (
  onAdd: (items: MediaItem[]) => void,
  onSkip?: (skipped: number) => void,
): (() => Promise<void>) => {
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
        PhotoPickFeedback.permissionDenied();
        return;
      }

      const result = isCamera
        ? await ImagePicker.launchCameraAsync(CAMERA_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(LIBRARY_OPTIONS);
      if (result.canceled) return;

      const accepted = result.assets.filter(withinLimit);
      onSkip?.(result.assets.length - accepted.length);
      const shrunk = await Promise.all(
        accepted.map((a) => shrinkForUpload({ uri: a.uri, width: a.width, height: a.height })),
      );
      if (shrunk.length > ValueConstants.zero) {
        onAdd(shrunk.map((url) => ({ type: MediaType.Image, url })));
      }
    } catch {
      PhotoPickFeedback.failed();
    } finally {
      busy.current = false;
    }
  }, [onAdd, onSkip]);
};
