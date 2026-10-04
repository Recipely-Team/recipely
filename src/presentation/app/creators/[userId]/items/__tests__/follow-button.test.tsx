import { FollowButton } from '@presentation/app/creators/[userId]/items/follow-button';
import { renderComponent } from '@presentation/base/test-support/render-component';

const toggle = (isFollowing: boolean) =>
  renderComponent(
    <FollowButton isFollowing={isFollowing} label="Follow" accessibilityLabel="Follow Ayşe" isPending={false} onPress={jest.fn()} />,
  ).root.find((n) => n.props.accessibilityRole === 'togglebutton' && typeof n.props.onPress === 'function');

describe('FollowButton', () => {
  it('reads as a toggle that is pressed once following', () => {
    expect(toggle(false).props.accessibilityState).toEqual(expect.objectContaining({ checked: false }));
    expect(toggle(true).props.accessibilityState).toEqual(expect.objectContaining({ checked: true }));
  });
});
