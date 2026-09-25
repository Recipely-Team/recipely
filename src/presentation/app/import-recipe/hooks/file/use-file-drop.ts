import type { ImportFile } from '@domain/recipes/import-file/import-file';

/**
 * Whether files are being dragged over the screen. Always false on the phone,
 * which has nothing to drag from; the web half listens to the window.
 */
export const useFileDrop = (_onFiles: (files: ImportFile[]) => void): boolean => false;
