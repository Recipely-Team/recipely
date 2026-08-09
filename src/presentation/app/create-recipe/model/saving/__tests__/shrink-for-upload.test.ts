/**
 * The symptom: publishing a recipe with a photo from the camera roll failed
 * with "file too large". The picker hands back the ORIGINAL capture — 4032px
 * and several megabytes on a recent phone — and it went into the multipart body
 * untouched, so the app was sending a request the server was always going to
 * refuse.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

// `mock`-prefixed so Jest's module factory may close over it.
const mockManipulate = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulate(...args),
  SaveFormat: { JPEG: 'jpeg' },
}));

import { shrinkForUpload } from '@presentation/app/create-recipe/model/saving/shrink-for-upload';
import {
  MEDIA_UPLOAD_MAX_EDGE,
  MEDIA_UPLOAD_QUALITY,
} from '@infrastructure/constants/media-upload';

beforeEach(() => {
  mockManipulate.mockReset();
  mockManipulate.mockResolvedValue({ uri: 'file://small.jpg' });
});

/** The actions argument the module passed to the manipulator. */
const actionsFor = (): { resize?: { width?: number; height?: number } }[] =>
  mockManipulate.mock.calls[0][1] as { resize?: { width?: number; height?: number } }[];

describe('shrinkForUpload', () => {
  it('returns the shrunk file, not the original the picker handed over', async () => {
    const uri = await shrinkForUpload({ uri: 'file://huge.heic', width: 4032, height: 3024 });

    expect(uri).toBe('file://small.jpg');
  });

  // Landscape and portrait must both come back inside the bound; capping the
  // wrong axis leaves the long edge untouched, which is the edge that carries
  // the bytes.
  it('caps the long edge of a landscape photo', async () => {
    await shrinkForUpload({ uri: 'file://huge.jpg', width: 4032, height: 3024 });

    expect(actionsFor()[0].resize).toEqual({ width: MEDIA_UPLOAD_MAX_EDGE });
  });

  it('caps the long edge of a portrait photo', async () => {
    await shrinkForUpload({ uri: 'file://huge.jpg', width: 3024, height: 4032 });

    expect(actionsFor()[0].resize).toEqual({ height: MEDIA_UPLOAD_MAX_EDGE });
  });

  // Enlarging a small photo would add bytes to fix a size problem.
  it('does not resize a photo already inside the bound', async () => {
    await shrinkForUpload({ uri: 'file://small.jpg', width: 800, height: 600 });

    expect(actionsFor()).toEqual([]);
  });

  // …but it is still re-encoded: a small HEIC or PNG can be large, and the
  // upload needs a known format at a known quality, not a small pixel count.
  it('re-encodes even when no resize is needed', async () => {
    await shrinkForUpload({ uri: 'file://small.png', width: 800, height: 600 });

    expect(mockManipulate.mock.calls[0][2]).toEqual({
      compress: MEDIA_UPLOAD_QUALITY,
      format: 'jpeg',
    });
  });

  // Losing the user's photo because the resize failed would be a worse bug than
  // the one being fixed; the server's own limit is still the backstop.
  it('falls back to the original when the manipulator fails', async () => {
    mockManipulate.mockRejectedValue(new Error('decode failed'));

    const uri = await shrinkForUpload({ uri: 'file://odd.tiff', width: 4032, height: 3024 });

    expect(uri).toBe('file://odd.tiff');
  });
});
