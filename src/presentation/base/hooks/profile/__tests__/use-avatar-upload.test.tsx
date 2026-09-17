/**
 * The symptom: a profile photo over 1 MB was refused, for a picture the server
 * renders at 256 square.
 *
 * The picker hands back the original capture — several megabytes at 4000px on a
 * recent phone — and this hook sent it untouched. The recipe media picker has
 * shrunk its photos since the day the same upload failed there; this path was
 * never brought along, so the only thing standing between a modern camera and
 * the reverse proxy's body cap was luck.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

// `mock`-prefixed so Jest's module factory may close over them.
const mockLaunchLibrary = jest.fn();
const mockShrink = jest.fn();
const mockUploadAvatar = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchLibrary(...args),
}));

jest.mock('@presentation/base/utils/shrink-for-upload', () => ({
  shrinkForUpload: (...args: unknown[]) => mockShrink(...args),
}));

jest.mock('@infrastructure/constants/platform', () => ({
  isWeb: () => true,
  isIos: () => false,
}));

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({ authStore: (select: (s: unknown) => unknown) => select({ uploadAvatar: mockUploadAvatar }) }),
}));

jest.mock('@presentation/base/feedback/show-toast', () => ({ showSuccessToast: jest.fn() }));

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useAvatarUpload } from '@presentation/base/hooks/profile/use-avatar-upload';
import { AVATAR_UPLOAD_MAX_EDGE } from '@infrastructure/constants/media-upload';
import type { AvatarUpload } from '@presentation/base/hooks/profile/avatar-upload';

const SHRUNK = 'file://shrunk.jpg';

beforeEach(() => {
  jest.clearAllMocks();
  mockShrink.mockResolvedValue(SHRUNK);
  mockUploadAvatar.mockResolvedValue(null);
  mockLaunchLibrary.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://original.heic', width: 4032, height: 3024 }],
  });
});

// react-test-renderer has no `renderHook`, so the hook is driven through a
// probe component — the pattern the rest of this repo's hook tests use.
const pick = async (): Promise<void> => {
  let latest!: AvatarUpload;
  const Probe = (): null => {
    latest = useAvatarUpload();
    return null;
  };

  renderComponent(<Probe />);
  await act(async () => {
    await latest.pickAndUpload();
  });
};

describe('useAvatarUpload', () => {
  it('shrinks the picked photo to the avatar bound before sending it', async () => {
    await pick();

    expect(mockShrink).toHaveBeenCalledWith(
      { uri: 'file://original.heic', width: 4032, height: 3024 },
      AVATAR_UPLOAD_MAX_EDGE,
    );
  });

  it('uploads the shrunk file, never the original the picker returned', async () => {
    await pick();

    expect(mockUploadAvatar).toHaveBeenCalledWith(SHRUNK, expect.any(String), expect.any(String));
  });

  // The name and type are derived from the URI, so reading them off the
  // original would have described a file that is no longer being sent — a HEIC
  // name on JPEG bytes.
  it('names the file after what is actually going up', async () => {
    await pick();

    const [, fileName, mimeType] = mockUploadAvatar.mock.calls[0] as [string, string, string];
    expect(fileName.endsWith('.jpg')).toBe(true);
    expect(mimeType).toBe('image/jpeg');
  });

  it('sends nothing when the picker was dismissed', async () => {
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

    await pick();

    expect(mockShrink).not.toHaveBeenCalled();
    expect(mockUploadAvatar).not.toHaveBeenCalled();
  });
});
