import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RecipeStatusBadge } from '@presentation/base/widgets/badges/recipe-status-badge';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { OwnerStatus } from '@domain/recipes/publishing/owner-status';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

describe('RecipeStatusBadge', () => {
  it.each([
    [OwnerStatus.Private, () => t().publishing.statusPrivate, 'icon:lock-closed'],
    [OwnerStatus.InReview, () => t().publishing.statusInReview, 'icon:time-outline'],
    [OwnerStatus.Published, () => t().publishing.statusPublished, 'icon:globe-outline'],
    [OwnerStatus.Rejected, () => t().publishing.statusRejected, 'icon:alert-circle'],
  ])('%s shows its short label and icon', (status, label, icon) => {
    const texts = textContent(renderComponent(<RecipeStatusBadge status={status} />).root);

    expect(texts).toContain(label());
    expect(texts).toContain(icon);
  });

  it('the Created-tab card carries the badge; a feed card does not', () => {
    const props = { name: 'Menemen', image: '', cuisine: 'Turkish', difficulty: 'easy', rating: 0, onPress: jest.fn() };

    const owned = textContent(renderComponent(<RecipeCard {...props} ownerStatus={OwnerStatus.InReview} />).root);
    const feed = textContent(renderComponent(<RecipeCard {...props} />).root);

    expect(owned).toContain(t().publishing.statusInReview);
    expect(feed).not.toContain(t().publishing.statusInReview);
  });
});
