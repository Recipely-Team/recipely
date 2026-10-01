import { Linking } from 'react-native';
import { act } from 'react-test-renderer';
import { PhotoCreditLine } from '@presentation/app/recipes/[recipeId]/items/media/photo-credit-line';
import { imageCreditOf } from '@application/__fixtures__/image-credit-of';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const links = (root: ReturnType<typeof renderComponent>['root']) =>
  root.findAll((n) => n.props.accessibilityRole === 'link' && typeof n.props.onPress === 'function');

describe('PhotoCreditLine', () => {
  it('renders nothing when the photo needs no credit', () => {
    const { root } = renderComponent(<PhotoCreditLine credit={null} />);

    expect(links(root)).toHaveLength(0);
  });

  it('is one link named for the author and licence, opening the source page', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const credit = imageCreditOf('Jane Doe', 'CC-BY-4.0', 'https://commons.wikimedia.org/wiki/File:Menemen.jpg');
    const { root } = renderComponent(<PhotoCreditLine credit={credit} />);

    const [link, ...rest] = links(root);
    expect(rest).toHaveLength(0);
    expect(link?.props.accessibilityLabel).toBe(
      t().recipes.photoCreditA11y.replace('{author}', 'Jane Doe').replace('{license}', 'CC-BY-4.0'),
    );
    const press: unknown = link?.props.onPress;
    if (typeof press !== 'function') throw new Error('no link');
    act(() => press());
    expect(openURL).toHaveBeenCalledWith(credit.url);
    openURL.mockRestore();
  });
});
