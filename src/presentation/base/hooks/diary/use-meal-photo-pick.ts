import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ValueConstants } from '@core/constants';
import type { MealParseInputType } from '@domain/diary/meal/meal-parse-input';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import { MEDIA_UPLOAD_MAX_EDGE } from '@infrastructure/constants/media-upload';
import { PickSource } from '@presentation/base/utils/pick-source';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import { shrinkForUpload } from '@presentation/base/utils/shrink-for-upload';
import { uploadFileMeta } from '@presentation/base/utils/upload-file-meta';
import { t } from '@presentation/i18n';

const MEAL_FILE_PREFIX = 'meal';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images' };

/** What a pick ended in: a photo to parse, nothing (cancelled), or no permission. */
type MealPhotoPick = { photo: MealParseInputType } | { photo: null; denied: boolean };

/**
 * Camera or library → a shrunk local photo ready for the meal parser. The same
 * picker, permission checks and `shrinkForUpload` as the avatar and recipe
 * photos; no new native module. The camera-or-library question is skipped on web.
 */
export const useMealPhotoPick = (locale: string): (() => Promise<MealPhotoPick>) =>
  useCallback(async (): Promise<MealPhotoPick> => {
    const source = await askPickSource(t().diary.mealLogPhoto);
    if (source === null) return { photo: null, denied: false };
    const camera = source === PickSource.Camera;
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { photo: null, denied: true };
    const result = camera ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS) : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    const asset = result.canceled ? undefined : result.assets[ValueConstants.zero];
    if (asset === undefined) return { photo: null, denied: false };
    const uri = await shrinkForUpload({ uri: asset.uri, width: asset.width, height: asset.height }, MEDIA_UPLOAD_MAX_EDGE);
    const { fileName, mimeType } = uploadFileMeta(uri, MEAL_FILE_PREFIX, String(Date.now()));
    return { photo: { kind: MealParseInputKind.Photo, uri, fileName, mimeType, locale } };
  }, [locale]);
