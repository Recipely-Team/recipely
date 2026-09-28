import { useCallback } from 'react';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';
import type { PickImportFilesCallback } from '@presentation/app/import-recipe/model/file/pick-import-files';
import { toImportFile } from '@presentation/app/import-recipe/model/file/to-import-file';

const INPUT_TYPE = 'file';
const ACCEPT = Object.values(ImportFileMimeType).join(',');
const CANCEL_EVENT = 'cancel';

/**
 * The browser's page picker: its own file dialog, photos and PDFs alike.
 *
 * @remarks
 * - **No camera question on the web** — `askPickSource` already answers
 *   "library" there, so `source` is not read.
 * - **A PDF is pickable here and not on the phone**: the file input needs no
 *   native module (see the native half).
 * - **Cancelling resolves empty.** Browsers fire `cancel` on the input when the
 *   dialog is closed without a choice.
 */
export const usePickImportFiles = (): PickImportFilesCallback =>
  useCallback(
    () =>
      new Promise<ImportFile[]>((resolve) => {
        const input = document.createElement('input');
        input.type = INPUT_TYPE;
        input.multiple = true;
        input.accept = ACCEPT;
        input.onchange = () => resolve(Array.from(input.files ?? []).map(toImportFile));
        input.addEventListener(CANCEL_EVENT, () => resolve([]));
        input.click();
      }),
    [],
  );
