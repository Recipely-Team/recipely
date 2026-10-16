/**
 * The import draft review, as the prototype's Import Review board draws it: a
 * calm note when the post had no recipe, a "What we read" row that opens the
 * caption and transcript, the Check chip legend, and a Check chip on a row
 * that is still a guessed line.
 */
import { act } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ImportReviewBlock } from '@presentation/app/create-recipe/body/import-review-block';
import { IngredientRow } from '@presentation/app/create-recipe/items/ingredient-row';
import { GuessedLinesContext } from '@presentation/app/create-recipe/model/review/guessed-lines-context';
import type { ImportReview } from '@presentation/app/create-recipe/model/review/import-review';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});

const review = (over: Partial<ImportReview> = {}): ImportReview => ({
  suggested: false,
  sourcePlatform: null,
  guessed: new Set(),
  ...over,
});

describe('ImportReviewBlock', () => {
  it('says the recipe was written for the dish when the post had none', () => {
    const { root } = renderComponent(<ImportReviewBlock review={review({ suggested: true })} showLegend={false} />);
    expect(textContent(root)).toContain(t().createRecipe.importReview.suggested);
  });

  it('opens what the import read, verbatim', () => {
    const { root } = renderComponent(<ImportReviewBlock review={review({ sourceText: 'Bugün menemen yaptık!' })} showLegend={false} />);
    const row = root.findAll((n) => n.props['accessibilityLabel'] === t().createRecipe.importReview.readTitle && typeof n.props['onPress'] === 'function')[0];
    act(() => (row?.props['onPress'] as () => void)());
    expect(textContent(root)).toContain('Bugün menemen yaptık!');
  });

  it('shows the legend only while a guessed line is on screen', () => {
    expect(textContent(renderComponent(<ImportReviewBlock review={review()} showLegend />).root)).toContain(t().createRecipe.importReview.legend);
    // Nothing to say: an ordinary import looks exactly as before.
    expect(textContent(renderComponent(<ImportReviewBlock review={review()} showLegend={false} />).root)).toEqual([]);
  });
});

describe('a guessed ingredient row', () => {
  const row = (value: string) =>
    renderComponent(
      <GuessedLinesContext.Provider value={new Set(['2 tomatoes'])}>
        <IngredientRow value={value} onChange={jest.fn()} onRemove={jest.fn()} removeLabel="remove" />
      </GuessedLinesContext.Provider>,
    ).root;

  it('carries the Check chip while unedited', () => {
    expect(textContent(row('2 tomatoes'))).toContain(t().createRecipe.importReview.check);
  });

  it('loses it once edited', () => {
    expect(textContent(row('2 ripe tomatoes'))).not.toContain(t().createRecipe.importReview.check);
  });
});
