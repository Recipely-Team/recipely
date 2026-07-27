import {
  byRole,
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { RecipeAuthorCard } from '@presentation/app/recipes/[recipeId]/items/meta/recipe-author-card';
import type { RecipeAuthorCardProps } from '@presentation/app/recipes/[recipeId]/items/meta/recipe-author-card';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';

const baseProps: RecipeAuthorCardProps = {
  authorName: 'Ada Lovelace',
  authorPhotoUrl: undefined,
  recipeCount: 12,
  isOwner: false,
};

const renderCard = (overrides: Partial<RecipeAuthorCardProps> = {}): RenderResult =>
  renderComponent(<RecipeAuthorCard {...baseProps} {...overrides} />);

describe('RecipeAuthorCard — other author', () => {
  it('shows the "Recipe by" eyebrow and the author name', () => {
    const { root } = renderCard();

    const texts = textContent(root);
    expect(texts).toContain(upperCase(t().recipes.recipeBy));
    expect(texts).toContain('Ada Lovelace');
  });

  it('does not render the "You" pill for someone else\'s recipe', () => {
    const { root } = renderCard();

    expect(textContent(root)).not.toContain(t().recipes.youPill);
  });
});

describe('RecipeAuthorCard — owner', () => {
  it('shows the "Your recipe" eyebrow and the "You" pill', () => {
    const { root } = renderCard({ isOwner: true });

    const texts = textContent(root);
    expect(texts).toContain(upperCase(t().recipes.yourRecipe));
    expect(texts).toContain(t().recipes.youPill);
    expect(texts).not.toContain(upperCase(t().recipes.recipeBy));
  });
});

describe('RecipeAuthorCard — recipe count interpolation', () => {
  it('interpolates the count into the recipeCount template', () => {
    const { root } = renderCard({ recipeCount: 7 });

    const expected = t().recipes.recipeCount.replace('{count}', '7');
    expect(textContent(root)).toContain(expected);
    expect(expected).not.toContain('{count}');
  });

  it('renders a zero count without leaving the placeholder', () => {
    const { root } = renderCard({ recipeCount: 0 });

    const expected = t().recipes.recipeCount.replace('{count}', '0');
    expect(textContent(root)).toContain(expected);
  });
});

describe('RecipeAuthorCard — not interactive', () => {
  it('exposes no button role (the card is info-only, never pressable)', () => {
    const { root } = renderCard();

    expect(() => byRole(root, 'button')).toThrow();
  });

  it('groups the author info under a single accessibility label', () => {
    const { root } = renderCard();

    const expected = `${t().recipes.recipeBy}, Ada Lovelace, ${t().recipes.recipeCount.replace('{count}', '12')}`;
    const labelled = root.find(
      (node) => node.props.accessibilityLabel === expected,
    );
    expect(labelled.props.accessible).toBe(true);
  });
});
