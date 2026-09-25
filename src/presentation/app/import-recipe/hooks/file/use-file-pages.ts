import { useCallback, useRef, useState } from 'react';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileBatch } from '@domain/recipes/import-file/import-file-batch';
import type { FilePage } from '@presentation/app/import-recipe/model/file/file-page';

interface UseFilePagesResult {
  pages: readonly FilePage[];
  /** Why the last pick did not all get in, or null. */
  failure: Failure | null;
  /** True when the batch is one PDF, which stands alone and is not reordered. */
  isPdf: boolean;
  /** True when nothing more may be added. */
  isFull: boolean;
  add: (files: readonly ImportFile[]) => void;
  remove: (index: number) => void;
  /** Moves the page at `from` to `to`; out-of-range targets are ignored. */
  move: (from: number, to: number) => void;
}

const KEY_PREFIX = 'page-';

/**
 * The picked pages, in reading order.
 *
 * @remarks
 * - **What may join the batch is the domain's call.** `ImportFileBatch.admit`
 *   says which of the offered files fit and why the rest did not; this hook
 *   only keeps the list and gives each page a key that follows it when it moves.
 * - **Removing a page clears the complaint**, since whatever was too many or too
 *   large is no longer the question.
 */
export const useFilePages = (): UseFilePagesResult => {
  const [pages, setPages] = useState<readonly FilePage[]>([]);
  const [failure, setFailure] = useState<Failure | null>(null);
  const nextKey = useRef(ValueConstants.zero);

  const add = useCallback(
    (files: readonly ImportFile[]): void => {
      const admitted = ImportFileBatch.admit(pages.map((page) => page.file), files);
      setFailure(admitted.failure);
      const added = admitted.files.slice(pages.length).map((file) => {
        nextKey.current += ValueConstants.one;
        return { key: `${KEY_PREFIX}${nextKey.current}`, file };
      });
      if (added.length > ValueConstants.zero) setPages([...pages, ...added]);
    },
    [pages],
  );

  const remove = useCallback((index: number): void => {
    setPages((current) => current.filter((_, i) => i !== index));
    setFailure(null);
  }, []);

  const move = useCallback((from: number, to: number): void => {
    setPages((current) => {
      if (to < ValueConstants.zero || to >= current.length || from === to) return current;
      const next = [...current];
      const [page] = next.splice(from, ValueConstants.one);
      next.splice(to, ValueConstants.zero, page);
      return next;
    });
  }, []);

  const files = pages.map((page) => page.file);
  return {
    pages,
    failure,
    isPdf: ImportFileBatch.holdsPdf(files),
    isFull: ImportFileBatch.isFull(files),
    add,
    remove,
    move,
  };
};
