/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockGetDocument = jest.fn();
jest.mock('expo-document-picker', () => ({ getDocumentAsync: (...a: unknown[]) => mockGetDocument(...a) }));
jest.mock('expo-image-picker', () => ({}));

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { usePickImportFiles } from '@presentation/app/import-recipe/hooks/file/use-pick-import-files';
import { PickSource } from '@presentation/base/utils/pick-source';
import type { ImportFile } from '@domain/recipes/import-file/import-file';

/** The phone takes a recipe PDF from the device's files, the third row the design draws. */
describe('picking a PDF on the phone', () => {
  const pick = async (): Promise<ImportFile[]> => {
    let run!: ReturnType<typeof usePickImportFiles>;
    const Probe = (): null => {
      run = usePickImportFiles();
      return null;
    };
    renderComponent(<Probe />);
    let out: ImportFile[] = [];
    await act(async () => {
      out = await run(PickSource.File);
    });
    return out;
  };

  it('returns the chosen PDF as one page', async () => {
    mockGetDocument.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://tarif.pdf', name: 'tarif.pdf', size: 1234 }] });
    expect(await pick()).toEqual([{ uri: 'file://tarif.pdf', fileName: 'tarif.pdf', mimeType: 'application/pdf', sizeBytes: 1234 }]);
    expect(mockGetDocument).toHaveBeenCalledWith(expect.objectContaining({ type: 'application/pdf' }));
  });

  it('returns nothing when the picker is closed', async () => {
    mockGetDocument.mockResolvedValue({ canceled: true, assets: null });
    expect(await pick()).toEqual([]);
  });
});
