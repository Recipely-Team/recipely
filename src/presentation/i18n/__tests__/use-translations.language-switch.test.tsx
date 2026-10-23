/**
 * A screen that is on show when the user switches language reads in the new one.
 *
 * Under the React Compiler, text built from the global `t()` is cached with the
 * component on its other inputs — and the language is not one of them — so a
 * mounted screen kept the old language until it was left and reopened. Text
 * comes from `useTranslations()`, which subscribes to the language like any
 * other state; the eslint rule on `t` keeps it that way.
 *
 * The component is real app code, so it runs compiled, as it ships.
 */
import { act } from 'react-test-renderer';
import { setLocale } from '@presentation/i18n';
import { en } from '@presentation/i18n/locales/en';
import { tr } from '@presentation/i18n/locales/tr';
import { EmptyTab } from '@presentation/app/my-recipes/items/empty-tab';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';

afterEach(() => act(() => setLocale('en')));

it('re-reads the text of a mounted screen when the language changes', () => {
  act(() => setLocale('en'));
  const { root } = renderComponent(<EmptyTab tab={TabType.Saved} onBrowse={jest.fn()} onCreate={jest.fn()} />);
  expect(textContent(root)).toContain(en.myRecipes.emptySaved);

  act(() => setLocale('tr'));

  expect(textContent(root)).toContain(tr.myRecipes.emptySaved);
  expect(textContent(root)).not.toContain(en.myRecipes.emptySaved);
});
