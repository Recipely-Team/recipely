import { useCallback, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileLimits } from '@domain/recipes/import-file/import-file-limits';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';
import { PickSource } from '@presentation/base/utils/pick-source';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import type { PickImportFilesCallback } from '@presentation/app/import-recipe/model/file/pick-import-files';
import { t } from '@presentation/i18n';

// No `quality`: `shrinkForUpload` owns the one re-encode.
const LIBRARY_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsMultipleSelection: true,
  orderedSelection: true,
  selectionLimit: ImportFileLimits.maxImages,
  mediaTypes: 'images',
};
const CAMERA_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images' };
const PAGE_FILE_PREFIX = 'page-';
const JPEG_EXTENSION = '.jpg';

const tellPermissionDenied = (): void => {
  Alert.alert(t().recipes.photoPermissionDenied, undefined, [
    { text: t().common.cancel, style: 'cancel' },
    { text: t().common.openSettings, onPress: () => void Linking.openSettings().catch(() => undefined) },
  ]);
};

/**
 * The phone's page picker: the camera, or photos from the library in the
 * order they were tapped.
 *
 * @remarks
 * - **A PDF comes from the device's files** through `expo-document-picker`;
 *   the web half reads one through the browser's own file input.
 * - **Every page leaves as a JPEG** through `shrinkForUpload`: a HEIC capture
 *   becomes a format every reader takes, and a 4000px photo stops being
 *   several megabytes. Its size is unknown after the re-encode, so the
 *   server's limit is the backstop.
 * - **One flight at a time**, as in the recipe editor's photo picker.
 */
export const usePickImportFiles = (): PickImportFilesCallback => {
  const busy = useRef(false);

  return useCallback(async (source: PickSource): Promise<ImportFile[]> => {
    if (busy.current) return [];
    busy.current = true;
    try {
      if (source === PickSource.File) {
        const doc = await DocumentPicker.getDocumentAsync({ type: ImportFileMimeType.Pdf, copyToCacheDirectory: true, multiple: false });
        const asset = doc.canceled ? undefined : doc.assets[0];
        if (asset === undefined) return [];
        return [{ uri: asset.uri, fileName: asset.name, mimeType: ImportFileMimeType.Pdf, sizeBytes: asset.size ?? null }];
      }
      const isCamera = source === PickSource.Camera;
      const permission = isCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        tellPermissionDenied();
        return [];
      }
      const result = isCamera
        ? await ImagePicker.launchCameraAsync(CAMERA_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(LIBRARY_OPTIONS);
      if (result.canceled) return [];

      const stamp = Date.now();
      const uris = await Promise.all(
        result.assets.map((a) => shrinkForUpload({ uri: a.uri, width: a.width, height: a.height })),
      );
      return uris.map((uri, index) => ({
        uri,
        fileName: `${PAGE_FILE_PREFIX}${stamp}-${index}${JPEG_EXTENSION}`,
        mimeType: ImportFileMimeType.Jpeg,
        sizeBytes: null,
      }));
    } catch {
      Alert.alert(t().recipes.photoAddFailed);
      return [];
    } finally {
      busy.current = false;
    }
  }, []);
};
