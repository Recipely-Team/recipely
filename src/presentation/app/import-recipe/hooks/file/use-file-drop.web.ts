import { useEffect, useRef, useState } from 'react';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ValueConstants } from '@core/constants';
import { toImportFile } from '@presentation/app/import-recipe/model/file/to-import-file';

/** The `DataTransfer` type a drag of files from the desktop carries. */
const FILES_TYPE = 'Files';

const carriesFiles = (event: DragEvent): boolean => event.dataTransfer?.types.includes(FILES_TYPE) ?? false;

/**
 * Makes the whole screen a drop target for photos and PDFs, and says when a
 * drag is over it.
 *
 * @remarks
 * - **The window, not a box.** The design lets a file land anywhere on the
 *   page; a drop missed by a few pixels would otherwise open the file in the
 *   tab and lose the screen.
 * - **Enter and leave are counted**, because the browser fires `dragleave`
 *   each time the pointer crosses into a child element — a plain flag flickers
 *   the highlight off in the middle of the page.
 */
export const useFileDrop = (onFiles: (files: ImportFile[]) => void): boolean => {
  const [isOver, setIsOver] = useState(false);
  const depth = useRef(ValueConstants.zero);

  useEffect(() => {
    const onEnter = (event: DragEvent): void => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current += ValueConstants.one;
      setIsOver(true);
    };
    const onOver = (event: DragEvent): void => {
      if (carriesFiles(event)) event.preventDefault();
    };
    const onLeave = (event: DragEvent): void => {
      if (!carriesFiles(event)) return;
      depth.current = Math.max(ValueConstants.zero, depth.current - ValueConstants.one);
      if (depth.current === ValueConstants.zero) setIsOver(false);
    };
    const onDrop = (event: DragEvent): void => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current = ValueConstants.zero;
      setIsOver(false);
      onFiles(Array.from(event.dataTransfer?.files ?? []).map(toImportFile));
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFiles]);

  return isOver;
};
