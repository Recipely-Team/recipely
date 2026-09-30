/**
 * Edit Profile's creator account section in each of the prototype's four
 * states, over the auth store's claim actions: the form sends a normalised
 * handle, a refusal shows its copy under the field, each sent claim offers
 * its own actions, and the claim is re-read when the page gains focus.
 */
import { TextInput } from 'react-native';
import { act, type ReactTestInstance } from 'react-test-renderer';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { Email } from '@domain/common/email';
import { UserEntity } from '@domain/auth/user-entity';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { CreatorAccountSection } from '@presentation/app/edit-profile/body/creator/creator-account-section';
import { t } from '@presentation/i18n';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
}));

const userWith = (status: CreatorStatus | null, platform = 'instagram', handle = 'aysemutfakta'): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const tag = CreatorTag.create(platform, handle);
  if (!tag.ok) throw new Error('fixture tag invalid');
  const claim = status === null ? null : CreatorClaim.create(tag.value, status);
  if (claim !== null && !claim.ok) throw new Error('fixture claim invalid');
  const user = UserEntity.create({ id: 'u-1', email: email.value, displayName: 'Ayşe', creatorClaim: claim === null ? null : claim.value });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

const renderSection = (status: CreatorStatus | null, overrides: Partial<AuthStoreState> = {}) => {
  const authStore = authStoreOf(userWith(status), overrides);
  const rendered = renderComponent(<CreatorAccountSection />, { authStore });
  return { ...rendered, actions: authStore.getState() };
};

const button = (root: ReactTestInstance, label: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

const radio = (root: ReactTestInstance, label: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

const press = async (node: ReactTestInstance): Promise<void> => {
  await act(async () => {
    (node.props.onPress as () => void)();
    await Promise.resolve();
    await Promise.resolve();
  });
};

const type = (root: ReactTestInstance, value: string): void => {
  act(() => (root.findByType(TextInput).props.onChangeText as (text: string) => void)(value));
};

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});

describe('CreatorAccountSection', () => {
  const copy = (): ReturnType<typeof t>['creators']['account'] => t().creators.account;

  it('re-reads the claim when the page gains focus', () => {
    const { actions } = renderSection(null);

    expect(actions.refreshCreatorClaim).toHaveBeenCalledTimes(1);
  });

  describe('no claim — the form', () => {
    it('offers both platforms, the username field and the send action', () => {
      const { root } = renderSection(null);

      expect(radio(root, 'Instagram').props.accessibilityState).toEqual({ checked: true });
      expect(radio(root, 'TikTok').props.accessibilityState).toEqual({ checked: false });
      expect(root.findAllByType(TextInput)).toHaveLength(1);
      expect(textContent(root)).toEqual(expect.arrayContaining([copy().title, copy().intro, copy().submit]));
    });

    it('sends the picked platform and the handle normalised', async () => {
      const { root, actions } = renderSection(null);

      await press(radio(root, 'TikTok'));
      type(root, '  @Sef.Kerem ');
      await press(button(root, copy().submit));

      expect(actions.requestCreatorTag).toHaveBeenCalledWith({ platform: 'tiktok', handle: 'sef.kerem' });
    });

    it('shows the refusal copy under the field when the claim is refused', async () => {
      const refusal = new ValidationFailure('bad handle', 'handle', ErrorMessageKey.creatorHandleInvalid);
      const { root } = renderSection(null, { requestCreatorTag: jest.fn(async () => refusal) });

      type(root, 'ayse..mutfakta');
      await press(button(root, copy().submit));

      expect(textContent(root)).toContain(t().errors.creatorHandleInvalid.short);
      expect(textContent(root)).not.toContain(copy().handleHint);
    });
  });

  it('in review: shows the account and offers to withdraw', async () => {
    const { root, actions } = renderSection(CreatorStatus.Pending);

    expect(textContent(root)).toEqual(expect.arrayContaining([copy().pending, '@aysemutfakta', copy().pendingBody]));
    await press(button(root, copy().withdraw));

    expect(actions.removeCreatorTag).toHaveBeenCalledTimes(1);
  });

  it('approved: offers change, which opens the form on the claim, and remove', async () => {
    const { root, actions } = renderSection(CreatorStatus.Approved);

    expect(textContent(root)).toEqual(expect.arrayContaining([copy().approved, copy().approvedBody]));
    await press(button(root, copy().remove));
    expect(actions.removeCreatorTag).toHaveBeenCalledTimes(1);

    await press(button(root, copy().change));
    expect(root.findByType(TextInput).props.value).toBe('aysemutfakta');
    await press(button(root, copy().cancel));
    expect(root.findAllByType(TextInput)).toHaveLength(0);
  });

  it('refused: names the handle and offers to edit and resend', async () => {
    const { root } = renderSection(CreatorStatus.Rejected);

    expect(textContent(root)).toEqual(
      expect.arrayContaining([copy().rejected, copy().rejectedBody.replace('{handle}', '@aysemutfakta')]),
    );
    await press(button(root, copy().resubmit));

    expect(root.findByType(TextInput).props.value).toBe('aysemutfakta');
  });
});
