import { ScreenContainer } from '@presentation/base/widgets/layout/screen-container';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { t } from '@presentation/i18n';
import { useFileImport } from '@presentation/app/import-recipe/hooks/file/use-file-import';
import { readingSubject } from '@presentation/app/import-recipe/model/file/reading-subject';
import { FilePickerView } from '@presentation/app/import-recipe/body/file/file-picker-view';
import { FileReadingView } from '@presentation/app/import-recipe/body/file/file-reading-view';
import { FilePageSheet } from '@presentation/app/import-recipe/sheets/file-page-sheet';

/**
 * A recipe from photos of its pages, or a PDF: pick, read, open the draft.
 *
 * @remarks
 * - **A failed reading is a full stop with two ways on** — back to the same
 *   pages ("Choose other pages"), or out. Its title is the failure's own, since
 *   "no recipe in this file" and "too many files" ask different things of the
 *   user.
 */
export const FileImportFlow = (): React.JSX.Element => {
  const vm = useFileImport();
  const copy = t().fileImport;

  useReportFailure(vm.failure, 'FileImportScreen');

  if (vm.failure !== null) {
    const content = failureContent(vm.failure);
    return (
      <ScreenContainer scrollable={false}>
        <ErrorState
          severity={failureSeverity(vm.failure)}
          icon={failureIcon(vm.failure)}
          title={content.title}
          body={content.body}
          primaryLabel={copy.retry}
          onPrimary={vm.onChoosePages}
          secondaryLabel={t().common.close}
          onSecondary={vm.onClose}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <ResponsiveContainer route="importRecipe" gutter={false} fill>
        {vm.isReading || vm.isDone ? (
          <FileReadingView
            activeStage={vm.activeStage}
            isDone={vm.isDone}
            subject={readingSubject(vm.pages, copy)}
            pagesLabel={vm.isPdf ? copy.pdfLabel : String(vm.pages.length)}
            onClose={vm.onClose}
          />
        ) : (
          <FilePickerView
            pages={vm.pages}
            pickFailure={vm.pickFailure}
            isPdf={vm.isPdf}
            isFull={vm.isFull}
            isDragging={vm.isDragging}
            onPick={vm.onPick}
            onAddPage={vm.onAddPage}
            onSelect={vm.onSelect}
            onRemove={vm.onRemove}
            onSubmit={vm.onSubmit}
            onClose={vm.onClose}
          />
        )}
      </ResponsiveContainer>
      <FilePageSheet
        pages={vm.pages}
        index={vm.selected}
        isPdf={vm.isPdf}
        onMove={vm.onMove}
        onRemove={vm.onRemove}
        onClose={vm.onCloseSheet}
      />
    </ScreenContainer>
  );
};
