/**
 * The symptom: in the recipe editor on a Turkish screen, the difficulty toggle
 * read "Easy / Medium / Hard" — a label map typed into the card in English —
 * while the recipe detail showed the same field as "Kolay / Orta / Zor".
 *
 * The toggle now takes its words from `difficultyLabel`, as the detail does.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => () => null);

import { RecipeSpecCard } from '@presentation/app/create-recipe/body/recipe-spec-card';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { setLocale, t } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';

const labels = (): string[] =>
  renderComponent(
    <RecipeSpecCard
      recipe={emptyEditable()}
      fieldErrors={{}}
      onChangeServings={jest.fn()}
      onChangeDifficulty={jest.fn()}
      onChangePrep={jest.fn()}
      onChangeCook={jest.fn()}
    />,
  )
    .root.findAll((node) => typeof node.props.accessibilityLabel === 'string')
    .map((node) => node.props.accessibilityLabel as string);

describe('RecipeSpecCard — difficulty toggle', () => {
  afterEach(() => setLocale(LocaleConstants.en));

  it('names the difficulty levels in Turkish on a Turkish screen', () => {
    setLocale(LocaleConstants.tr);

    const shown = labels();

    expect(shown).toEqual(
      expect.arrayContaining([t().recipes.difficultyEasy, t().recipes.difficultyMedium, t().recipes.difficultyHard]),
    );
    expect(shown).not.toContain('Medium');
  });
});
