import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { renderComponent } from '@presentation/base/test-support/render-component';

/**
 * Signed out, the web header used to build initials from a placeholder display
 * name and show "RU" in the corner — which reads as an account that is signed
 * in ("giriş yapmadığımızda profil resmi yerine harfler var sanki profil açık
 * gibi duruyor"). Nobody's avatar is a generic mark, not somebody's letters.
 */
describe('AvatarImage', () => {
  const AVATAR_SIZE = 40;

  it('draws the person mark when there is nobody to name', () => {
    const tree = renderComponent(<AvatarImage name="" size={AVATAR_SIZE} />);

    expect(tree.root.findByType(Ionicons).props.name).toBe('person');
    // The icon font draws through a Text of its own, so what matters is that
    // no letters are written into one.
    const written = tree.root.findAllByType(Text).map((node) => node.props.children);
    expect(written.filter((child) => typeof child === 'string')).toEqual([]);
  });

  it('still shows initials for somebody who has a name', () => {
    const tree = renderComponent(<AvatarImage name="Recep Tayyip" size={AVATAR_SIZE} />);

    expect(tree.root.findAllByType(Ionicons)).toHaveLength(0);
    expect(tree.root.findByType(Text).props.children).toBe('RT');
  });
});
