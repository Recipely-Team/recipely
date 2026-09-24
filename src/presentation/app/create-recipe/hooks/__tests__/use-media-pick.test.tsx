/**
 * The symptom: the recipe editor's "Add photos" opened the library and nothing
 * else — there was no way to photograph the dish from inside the app, while
 * the avatar and a published recipe's photos both offered the camera.
 *
 * And a refused photo permission returned an empty list, which read as a
 * button that did nothing; once iOS has been answered it never asks again.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockAsk = jest.fn();
const mockLaunchCamera = jest.fn();
const mockLaunchLibrary = jest.fn();
const mockCameraPermission = jest.fn();
const mockLibraryPermission = jest.fn();
const mockShrink = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: (...args: unknown[]) => mockCameraPermission(...args),
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockLibraryPermission(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCamera(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchLibrary(...args),
}));

jest.mock('@presentation/base/utils/ask-pick-source', () => ({
  askPickSource: (...args: unknown[]) => mockAsk(...args),
}));

jest.mock('@presentation/base/utils/shrink-for-upload', () => ({
  shrinkForUpload: (...args: unknown[]) => mockShrink(...args),
}));

import { Alert, Linking } from 'react-native';
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useMediaPick } from '@presentation/app/create-recipe/hooks/use-media-pick';
import { PickSource } from '@presentation/base/utils/pick-source';
import { MediaType } from '@domain/recipes/media/media-type';
import { t } from '@presentation/i18n';

const CAPTURE = { uri: 'file://capture.jpg', width: 4032, height: 3024 };
const SHRUNK = 'file://shrunk.jpg';

beforeEach(() => {
  jest.clearAllMocks();
  mockCameraPermission.mockResolvedValue({ granted: true });
  mockLibraryPermission.mockResolvedValue({ granted: true });
  mockLaunchCamera.mockResolvedValue({ canceled: false, assets: [CAPTURE] });
  mockShrink.mockResolvedValue(SHRUNK);
});

const pick = async (onAdd: jest.Mock): Promise<void> => {
  let add!: () => Promise<void>;
  const Probe = (): null => {
    add = useMediaPick(onAdd);
    return null;
  };
  renderComponent(<Probe />);
  await act(async () => {
    await add();
  });
};

describe('useMediaPick', () => {
  it('lets the cook photograph the dish, and adds the shrunk capture', async () => {
    mockAsk.mockResolvedValue(PickSource.Camera);
    const onAdd = jest.fn();

    await pick(onAdd);

    expect(mockLaunchCamera).toHaveBeenCalledTimes(1);
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
    expect(mockShrink).toHaveBeenCalledWith(CAPTURE);
    expect(onAdd).toHaveBeenCalledWith([{ type: MediaType.Image, url: SHRUNK }]);
  });

  it('adds nothing when the source question is backed out of', async () => {
    mockAsk.mockResolvedValue(null);
    const onAdd = jest.fn();

    await pick(onAdd);

    expect(mockLaunchCamera).not.toHaveBeenCalled();
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('says a refused library out loud instead of doing nothing', async () => {
    mockAsk.mockResolvedValue(PickSource.Library);
    mockLibraryPermission.mockResolvedValue({ granted: false });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onAdd = jest.fn();

    await pick(onAdd);

    expect(mockLaunchLibrary).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(t().recipes.photoPermissionDenied, undefined, expect.any(Array));
    alert.mockRestore();
  });

  it('says a picker that throws out loud', async () => {
    mockAsk.mockResolvedValue(PickSource.Camera);
    mockLaunchCamera.mockRejectedValue(new Error('camera unavailable'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onAdd = jest.fn();

    await pick(onAdd);

    expect(alert).toHaveBeenCalledWith(t().recipes.photoAddFailed);
    expect(onAdd).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('says a refused camera out loud and offers the way to Settings', async () => {
    mockAsk.mockResolvedValue(PickSource.Camera);
    mockCameraPermission.mockResolvedValue({ granted: false });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const onAdd = jest.fn();

    await pick(onAdd);

    expect(mockLaunchCamera).not.toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    const settings = buttons.find((b) => b.text === t().common.openSettings);
    settings?.onPress?.();
    expect(openSettings).toHaveBeenCalledTimes(1);

    alert.mockRestore();
    openSettings.mockRestore();
  });
});
