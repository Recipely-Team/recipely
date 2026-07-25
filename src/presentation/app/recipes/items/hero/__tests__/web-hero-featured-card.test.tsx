/**
 * `WebHeroFeaturedCard` dropped its author row when it moved to the lean
 * `RecipeSummaryEntity` (trending list items have no `ownerId` to resolve an author
 * from) — the card must render fine without ever trying to fetch or show one.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { WebHeroFeaturedCard } from '@presentation/app/recipes/items/hero/web-hero-featured-card';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const recipe = RecipeSummaryEntity.create({
  id: 'r1',
  name: 'Trending Trending Pasta',
  image: '',
  cuisine: 'ITALIAN',
  category: 'MAIN',
  difficulty: 'EASY',
  totalTimeMinutes: 45,
  rating: 4.7,
  moderationStatus: 'approved',
  likeCount: 10,
  likedByMe: false,
  commentCount: 2,
  viewCount: 100,
});

describe('WebHeroFeaturedCard — author row removed', () => {
  it('renders without an author line (no ownerId on RecipeSummaryEntity)', () => {
    if (!recipe.ok) throw new Error('fixture invalid');
    const { root } = renderComponent(
      <WebHeroFeaturedCard recipe={recipe.value} onPress={jest.fn()} />,
    );

    const texts = textContent(root);
    expect(texts).toContain(recipe.value.name);
    expect(texts.some((text) => text.startsWith('by '))).toBe(false);
  });
});
