/**
 * A language preview changes the text of the screen it wraps and nothing else.
 *
 * The dev-only picker on the create-recipe screen shows the screen in another
 * language to check its layout. The saved language must stay where the user left
 * it, and a screen outside the preview must keep reading the app's language.
 */
import { act } from 'react-test-renderer';
import { getLocale, setLocale } from '@presentation/i18n';
import { LocalePreviewContext } from '@presentation/i18n/locale-preview-context';
import { en } from '@presentation/i18n/locales/en';
import { tr } from '@presentation/i18n/locales/tr';
import { EmptyTab } from '@presentation/app/my-recipes/items/empty-tab';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';

afterEach(() => act(() => setLocale('en')));

const emptyTab = <EmptyTab tab={TabType.Saved} onBrowse={jest.fn()} onCreate={jest.fn()} />;

it('shows the previewed language inside the preview', () => {
  act(() => setLocale('en'));
  const { root } = renderComponent(<LocalePreviewContext.Provider value="tr">{emptyTab}</LocalePreviewContext.Provider>);

  expect(textContent(root)).toContain(tr.myRecipes.emptySaved);
});

it('leaves the saved language alone', () => {
  act(() => setLocale('en'));
  renderComponent(<LocalePreviewContext.Provider value="tr">{emptyTab}</LocalePreviewContext.Provider>);

  expect(getLocale()).toBe('en');
});

it('reads the app language when no preview is given', () => {
  act(() => setLocale('en'));
  const { root } = renderComponent(emptyTab);

  expect(textContent(root)).toContain(en.myRecipes.emptySaved);
});
