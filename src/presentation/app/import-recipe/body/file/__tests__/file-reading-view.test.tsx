import { FileReadingView } from '@presentation/app/import-recipe/body/file/file-reading-view';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

/**
 * Leaving the reading screen does not stop the reading: the request runs on
 * and the draft still lands. A button that said Cancel would promise what it
 * cannot keep, so it says Close.
 */
describe('FileReadingView', () => {
  it('offers Close, never a Cancel it cannot keep', () => {
    const { root } = renderComponent(
      <FileReadingView activeStage={1} isDone={false} subject="x" pagesLabel="2" onClose={jest.fn()} />,
    );
    const shown = textContent(root);
    expect(shown).toContain(t().common.close);
    expect(shown).not.toContain(t().common.cancel);
  });
});
