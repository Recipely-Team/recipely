import { useCallback, useEffect, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import type { PickSource } from '@presentation/base/utils/pick-source';
import { t } from '@presentation/i18n';
import { useFilePages } from '@presentation/app/import-recipe/hooks/file/use-file-pages';
import { usePickImportFiles } from '@presentation/app/import-recipe/hooks/file/use-pick-import-files';
import { useFileDrop } from '@presentation/app/import-recipe/hooks/file/use-file-drop';
import { FILE_STAGE_KEYS } from '@presentation/app/import-recipe/model/file/file-stage-keys';
import { FILE_STAGE_TICK_MS } from '@presentation/app/import-recipe/model/file/file-reading-timing';
import type { FilePage } from '@presentation/app/import-recipe/model/file/file-page';

interface UseFileImportResult {
  pages: readonly FilePage[];
  /** Why the last pick did not all get in — shown above the grid. */
  pickFailure: Failure | null;
  isPdf: boolean;
  isFull: boolean;
  /** True while a file is being dragged over the window (web). */
  isDragging: boolean;
  /** The page whose sheet is open, or null. */
  selected: number | null;
  /** True from the tap on "Read recipe" until the draft opens. */
  isReading: boolean;
  isDone: boolean;
  /** 0..stage count — how far the reading checklist has filled. */
  activeStage: number;
  /** Why the reading failed, or null. */
  failure: Failure | null;
  onPick: (source: PickSource) => void;
  /** Asks camera-or-library (the phone) and adds what comes back. */
  onAddPage: () => void;
  onSelect: (index: number) => void;
  onCloseSheet: () => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onSubmit: () => void;
  /** Back to the picker with the same pages, after a failed reading. */
  onChoosePages: () => void;
  onClose: () => void;
}

const STAGE_COUNT = FILE_STAGE_KEYS.length;

/**
 * Drives the file import: pick the pages, read them, open the draft.
 *
 * @remarks
 * - **The pages outlive a failed reading.** "Choose other pages" returns to
 *   the picker with the batch as it was, so a blurry third page is replaced
 *   rather than the whole recipe photographed again.
 * - **The checklist creeps, it does not report.** The server answers once, at
 *   the end; the list walks on a clock and stops one short of the last stage
 *   until the draft exists.
 * - **Leaving is not cancelling.** A reading the user walked away from still
 *   becomes a draft on the server; only this screen's copy of the answer is
 *   dropped, so it cannot navigate from behind whatever they opened next.
 */
export const useFileImport = (): UseFileImportResult => {
  const router = useRouter();
  const goBackOrHome = useGoBackOrHome();
  const { fileImportStore } = useStores();
  const state = fileImportStore((s) => s.state);
  const pages = useFilePages();
  const pick = usePickImportFiles();
  const isDragging = useFileDrop(pages.add);
  const [selected, setSelected] = useState<number | null>(null);
  const [ticks, setTicks] = useState(ValueConstants.zero);

  const isReading = state.status === StoreStatus.Loading;
  const draftId = state.status === StoreStatus.Loaded ? state.receipt.draftId : null;

  useEffect(() => () => fileImportStore.getState().clear(), [fileImportStore]);

  useEffect(() => {
    if (!isReading) return;
    setTicks(ValueConstants.zero);
    const tick = setInterval(() => setTicks((n) => n + ValueConstants.one), FILE_STAGE_TICK_MS);
    return () => clearInterval(tick);
  }, [isReading]);

  useEffect(() => {
    if (draftId === null) return;
    router.replace({ pathname: RoutePaths.createRecipe, params: { draftId } } as Href);
  }, [draftId, router]);

  const { add, remove, move } = pages;
  const onPick = useCallback(
    (source: PickSource): void => {
      void pick(source).then((files) => {
        if (files.length > ValueConstants.zero) add(files);
      });
    },
    [pick, add],
  );

  const onAddPage = useCallback((): void => {
    void askPickSource(t().fileImport.addSheet).then((source) => {
      if (source !== null) onPick(source);
    });
  }, [onPick]);

  const onRemove = useCallback(
    (index: number): void => {
      setSelected(null);
      remove(index);
    },
    [remove],
  );

  const onMove = useCallback(
    (from: number, to: number): void => {
      if (to < ValueConstants.zero || to >= pages.pages.length) return;
      move(from, to);
      setSelected(to);
    },
    [move, pages.pages.length],
  );

  const onSubmit = useCallback((): void => {
    if (pages.pages.length === ValueConstants.zero) return;
    void fileImportStore.getState().importFiles(pages.pages.map((page) => page.file));
  }, [fileImportStore, pages.pages]);

  const onChoosePages = useCallback(() => fileImportStore.getState().clear(), [fileImportStore]);

  const onClose = useCallback((): void => {
    fileImportStore.getState().clear();
    goBackOrHome();
  }, [fileImportStore, goBackOrHome]);

  const isDone = draftId !== null;
  const creeping = Math.min(STAGE_COUNT - ValueConstants.two, ticks);
  return {
    pages: pages.pages,
    pickFailure: pages.failure,
    isPdf: pages.isPdf,
    isFull: pages.isFull,
    isDragging,
    selected,
    isReading,
    isDone,
    activeStage: isDone ? STAGE_COUNT : creeping,
    failure: state.status === StoreStatus.Error ? state.failure : null,
    onPick,
    onAddPage,
    onSelect: setSelected,
    onCloseSheet: () => setSelected(null),
    onMove,
    onRemove,
    onSubmit,
    onChoosePages,
    onClose,
  };
};
