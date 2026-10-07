/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@presentation/base/utils/ask-pick-source', () => ({ askPickSource: jest.fn() }));
jest.mock('@presentation/base/utils/shrink-for-upload', () => ({ shrinkForUpload: jest.fn(async () => 'file:///shrunk.png') }));

import * as ImagePicker from 'expo-image-picker';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import { PickSource } from '@presentation/base/utils/pick-source';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useMealPhotoPick } from '@presentation/base/hooks/diary/use-meal-photo-pick';

/**
 * **Picking the meal photo.** Separates "the user backed out" (no message) from "the OS refused
 * access" (`denied`, which the form explains), and hands back an upload-ready photo in the
 * reader's locale.
 */
const picker = jest.mocked(ImagePicker);
const ask = jest.mocked(askPickSource);
const ASSET = { uri: 'file:///raw.jpg', width: 4000, height: 3000 };

const pickWith = (locale = 'tr') => {
  const box: { pick: ReturnType<typeof useMealPhotoPick> | null } = { pick: null };
  const Probe = (): null => {
    box.pick = useMealPhotoPick(locale);
    return null;
  };
  renderComponent(<Probe />);
  if (box.pick === null) throw new Error('hook did not render');
  return box.pick();
};

describe('useMealPhotoPick', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns nothing, without a denial, when the user closes the source chooser', async () => {
    ask.mockResolvedValue(null);

    await expect(pickWith()).resolves.toEqual({ photo: null, denied: false });
    expect(picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reports a denial when camera access is refused, and never opens the camera', async () => {
    ask.mockResolvedValue(PickSource.Camera);
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as ImagePicker.CameraPermissionResponse);

    await expect(pickWith()).resolves.toEqual({ photo: null, denied: true });
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('returns nothing, without a denial, when the user cancels the library', async () => {
    ask.mockResolvedValue(PickSource.Library);
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.MediaLibraryPermissionResponse);
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });

    await expect(pickWith()).resolves.toEqual({ photo: null, denied: false });
  });

  it('hands back the shrunk photo, named and typed for upload, in the reader locale', async () => {
    ask.mockResolvedValue(PickSource.Camera);
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
    picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [ASSET] } as ImagePicker.ImagePickerResult);

    const result = await pickWith('de');

    expect(result.photo).toMatchObject({ kind: MealParseInputKind.Photo, uri: 'file:///shrunk.png', mimeType: 'image/png', locale: 'de' });
    expect(result.photo?.kind === MealParseInputKind.Photo && result.photo.fileName).toMatch(/^meal-\d+\.png$/);
  });
});
