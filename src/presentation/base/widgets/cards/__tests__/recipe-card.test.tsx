/**
 * `RecipeCard`'s `tags` prop is optional (lean `RecipeSummaryEntity` list contexts
 * omit it entirely) — the tags-chip row must simply be absent rather than
 * crash or render empty chips when `tags` is undefined.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { MaterialCommunityIcons: Icon, Ionicons: Icon };
});

const baseProps = {
  name: 'Tomato Soup',
  image: '',
  cuisine: 'Italian',
  difficulty: 'easy',
  rating: 4.5,
  onPress: jest.fn(),
};

describe('RecipeCard — tags', () => {
  it('renders without a tags prop (lean RecipeSummaryEntity list contexts)', () => {
    expect(() => renderComponent(<RecipeCard {...baseProps} />)).not.toThrow();
  });

  it('shows no tag chips when tags is omitted', () => {
    const { root } = renderComponent(<RecipeCard {...baseProps} />);

    expect(textContent(root)).not.toContain('vegan');
  });

  it('shows tag chips when tags is provided', () => {
    const { root } = renderComponent(<RecipeCard {...baseProps} tags={['vegan', 'quick']} />);

    const texts = textContent(root);
    expect(texts).toContain('vegan');
    expect(texts).toContain('quick');
  });
});

describe('RecipeCard — photos', () => {
  it('shows no count for a recipe with a single photo', () => {
    const { root } = renderComponent(<RecipeCard {...baseProps} photoCount={1} />);

    expect(textContent(root)).not.toContain('icon:image');
  });

  it('shows the count from two photos up', () => {
    const { root } = renderComponent(<RecipeCard {...baseProps} photoCount={3} />);

    const texts = textContent(root);
    expect(texts).toContain('icon:image');
    expect(texts).toContain('3');
  });

  it('offers the Created tab a way to the photos', () => {
    const onEditPhotos = jest.fn();
    const { root } = renderComponent(<RecipeCard {...baseProps} onEditPhotos={onEditPhotos} />);

    const button = root.findAll(
      (n) => n.props['accessibilityLabel'] === t().photoViewer.editPhotos && typeof n.props['onPress'] === 'function',
    )[0];
    (button?.props['onPress'] as () => void)();

    expect(onEditPhotos).toHaveBeenCalledTimes(1);
  });
});
