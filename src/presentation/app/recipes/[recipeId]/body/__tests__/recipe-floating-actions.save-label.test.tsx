/**
 * The symptom: on the mobile recipe detail in Turkish, the bookmark button in
 * the floating cluster announced "Add to favorites" — English, typed straight
 * into the component — while its neighbours (share, copy, like) spoke Turkish.
 * A screen reader user heard one English phrase in a Turkish screen.
 *
 * The label now comes from the same keys the web header's save button uses.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialCommunityIcons: () => null }));

import { RecipeFloatingActions } from '@presentation/app/recipes/[recipeId]/body/recipe-floating-actions';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { setLocale, t } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';

const labelsOf = (isSaved: boolean): string[] =>
  renderComponent(
    <RecipeFloatingActions
      insetsTop={0}
      liked={false}
      isSaved={isSaved}
      saveDisabled={false}
      onShare={jest.fn()}
      onCopyToDraft={jest.fn()}
      onToggleLike={jest.fn()}
      onToggleSave={jest.fn()}
    />,
  )
    .root.findAll((node) => typeof node.props.accessibilityLabel === 'string')
    .map((node) => node.props.accessibilityLabel as string);

describe('RecipeFloatingActions — save button label', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it('speaks the bookmark button in Turkish on a Turkish screen', () => {
    setLocale(LocaleConstants.tr);

    const unsaved = labelsOf(false);
    const saved = labelsOf(true);

    expect(unsaved).toContain(t().recipes.save);
    expect(saved).toContain(t().recipes.saved);
    expect([...unsaved, ...saved]).not.toContain('Add to favorites');
    expect([...unsaved, ...saved]).not.toContain('Remove from favorites');
  });
});
