import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ExitSheet } from '@presentation/app/create-recipe/sheets/exit-sheet';
import { t } from '@presentation/i18n';

const handlers = { onSaveDraft: jest.fn(), onDiscard: jest.fn(), onKeepEditing: jest.fn() };

describe('ExitSheet', () => {
  it('asks about the draft for a new recipe', () => {
    const texts = textContent(renderComponent(<ExitSheet visible {...handlers} />).root);

    expect(texts).toContain(t().createRecipe.exitSave);
    expect(texts).toContain(t().createRecipe.exitDiscard);
  });

  it('asks save-or-discard about the changes when editing a saved recipe', () => {
    const texts = textContent(renderComponent(<ExitSheet visible editing {...handlers} />).root);

    expect(texts).toContain(t().createRecipe.editExitTitle);
    expect(texts).toContain(t().createRecipe.save);
    expect(texts).toContain(t().createRecipe.editExitDiscard);
    expect(texts).not.toContain(t().createRecipe.exitSave);
  });
});
