/**
 * Edit Profile's creator account section, one row per platform (design spec
 * §7, rev 2): a Link row opens the form for its platform, each claimed platform
 * shows its own status and action, and only one form is open at a time.
 */
import { TextInput } from 'react-native';
import { act, type ReactTestInstance } from 'react-test-renderer';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { Email } from '@domain/common/email';
import { UserEntity } from '@domain/auth/user-entity';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { instagramStoreOf } from '@presentation/base/test-support/instagram-store-of';
import { CreatorAccountSection } from '@presentation/app/edit-profile/body/creator/creator-account-section';
import { t } from '@presentation/i18n';
import { connectionOf } from '@application/instagram/__fixtures__/instagram-fixtures';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
  useRouter: () => ({ push: mockPush }),
}));

type ClaimSpec = [platform: string, status: CreatorStatus, handle?: string];

const userWith = (...specs: ClaimSpec[]): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const claims = specs.map(([platform, status, handle = 'aysemutfakta']) => {
    const tag = CreatorTag.create(platform, handle);
    if (!tag.ok) throw new Error('fixture tag invalid');
    const claim = CreatorClaim.create(tag.value, status);
    if (!claim.ok) throw new Error('fixture claim invalid');
    return claim.value;
  });
  const created = CreatorClaims.create(claims);
  if (!created.ok) throw new Error('fixture claims invalid');
  const user = UserEntity.create({ id: 'u-1', email: email.value, displayName: 'Ayşe', creatorClaims: created.value });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

const renderSection = (specs: ClaimSpec[], overrides: Partial<AuthStoreState> = {}, instagram = instagramStoreOf()) => {
  const authStore = authStoreOf(userWith(...specs), overrides);
  const rendered = renderComponent(<CreatorAccountSection />, { authStore, instagramStore: instagram.store });
  return { ...rendered, actions: authStore.getState(), instagram };
};

const button = (root: ReactTestInstance, label: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

const buttons = (root: ReactTestInstance, label: string): ReactTestInstance[] =>
  root.findAll((node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

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

const linkLabel = (platform: string): string => t().creators.account.linkAccount.replace('{platform}', platform);

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});

describe('CreatorAccountSection', () => {
  const copy = (): ReturnType<typeof t>['creators']['account'] => t().creators.account;

  it('re-reads the claims when the page gains focus', () => {
    const { actions } = renderSection([]);

    expect(actions.refreshCreatorClaim).toHaveBeenCalledTimes(1);
  });

  describe('nothing linked', () => {
    it('shows the intro and a Link row per platform, with no form open', () => {
      const { root } = renderSection([]);

      expect(textContent(root)).toContain(copy().intro);
      expect(buttons(root, linkLabel('Instagram'))).toHaveLength(1);
      expect(buttons(root, linkLabel('TikTok'))).toHaveLength(1);
      expect(root.findAllByType(TextInput)).toHaveLength(0);
    });

    it('opens the form for the tapped platform and sends its handle normalised', async () => {
      const { root, actions } = renderSection([]);

      await press(button(root, linkLabel('TikTok')));
      type(root, '  @Sef.Kerem ');
      await press(button(root, copy().submit));

      expect(actions.requestCreatorTag).toHaveBeenCalledWith({ platform: 'tiktok', handle: 'sef.kerem' });
    });

    it('keeps one form open at a time', async () => {
      const { root } = renderSection([]);

      await press(button(root, linkLabel('Instagram')));
      await press(button(root, linkLabel('TikTok')));

      expect(root.findAllByType(TextInput)).toHaveLength(1);
      expect(buttons(root, linkLabel('Instagram'))).toHaveLength(1);
    });

    it('Cancel closes the form back to its Link row', async () => {
      const { root } = renderSection([]);

      await press(button(root, linkLabel('Instagram')));
      await press(button(root, copy().cancel));

      expect(root.findAllByType(TextInput)).toHaveLength(0);
    });

    it('a double tap on send sends one claim', async () => {
      const { root, actions } = renderSection([], { requestCreatorTag: jest.fn(() => new Promise<null>(() => undefined)) });
      await press(button(root, linkLabel('Instagram')));
      type(root, 'aysemutfakta');

      const send = button(root, copy().submit).props.onPress as () => void;
      await act(async () => {
        send();
        send();
        await Promise.resolve();
      });

      expect(actions.requestCreatorTag).toHaveBeenCalledTimes(1);
    });

    it('shows the refusal copy under the field when the claim is refused', async () => {
      const refusal = new ValidationFailure('bad handle', 'handle', ErrorMessageKey.creatorHandleInvalid);
      const { root } = renderSection([], { requestCreatorTag: jest.fn(async () => refusal) });

      await press(button(root, linkLabel('Instagram')));
      type(root, 'ayse..mutfakta');
      await press(button(root, copy().submit));

      expect(textContent(root)).toContain(t().errors.creatorHandleInvalid.short);
      expect(textContent(root)).not.toContain(copy().handleHint);
    });

    it('keeps send disabled until the handle is long enough for the platform', async () => {
      const { root } = renderSection([]);

      await press(button(root, linkLabel('TikTok')));
      type(root, 'a');
      expect(button(root, copy().submit).props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
      type(root, 'ab');
      expect(button(root, copy().submit).props.accessibilityState).toEqual(expect.objectContaining({ disabled: false }));
    });

    it('drops a typed @ and spaces from the handle field', async () => {
      const { root } = renderSection([]);

      await press(button(root, linkLabel('Instagram')));
      type(root, '@ayse mutfakta');
      expect(root.findByType(TextInput).props.value).toBe('aysemutfakta');
    });
  });

  it('in review on one platform: withdraws that platform only, and still offers to link the other', async () => {
    const { root, actions } = renderSection([['instagram', CreatorStatus.Pending]]);

    expect(textContent(root)).toEqual(expect.arrayContaining([copy().pending, '@aysemutfakta', copy().pendingBody]));
    expect(buttons(root, linkLabel('TikTok'))).toHaveLength(1);
    await press(button(root, copy().withdraw));

    expect(actions.removeCreatorTag).toHaveBeenCalledWith('instagram');
  });

  it('two platforms: each row its own status, a live region, and approved links to the account', async () => {
    const { root, actions } = renderSection([
      ['instagram', CreatorStatus.Approved],
      ['tiktok', CreatorStatus.Pending, 'ayse.mutfakta'],
    ]);

    expect(textContent(root)).toEqual(expect.arrayContaining([copy().approved, copy().approvedBody, copy().pending]));
    expect(root.findAll((n) => n.props.role === 'status').length).toBeGreaterThanOrEqual(2);
    expect(root.findAll((n) => n.props.accessibilityRole === 'link').length).toBeGreaterThan(0);
    expect(buttons(root, linkLabel('Instagram'))).toHaveLength(0);
    await press(button(root, copy().remove));

    expect(actions.removeCreatorTag).toHaveBeenCalledWith('instagram');
  });

  it('rejected: names the handle and Try again opens the form prefilled', async () => {
    const { root } = renderSection([['tiktok', CreatorStatus.Rejected]]);

    expect(textContent(root)).toEqual(
      expect.arrayContaining([copy().rejected, copy().rejectedBody.replace('{handle}', '@aysemutfakta')]),
    );
    await press(button(root, copy().resubmit));

    expect(root.findByType(TextInput).props.value).toBe('aysemutfakta');
  });

  describe('Instagram login offered', () => {
    const ig = () => t().instagram;

    it('offers Connect with Instagram in the Instagram row, and the manual handle form one tap away', async () => {
      const { root } = renderSection([], {}, instagramStoreOf(connectionOf({ connected: false, status: null })));
      await act(async () => undefined);
      expect(textContent(root)).toEqual(expect.arrayContaining([ig().connect, ig().manual]));
      const manual = root.find((n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function' && textContent(n).includes(ig().manual));
      await press(manual);
      expect(root.findAllByType(TextInput)).toHaveLength(1);
    });

    it('shows the linked account, verified via Instagram, and disconnects only after the confirmation', async () => {
      const instagram = instagramStoreOf(connectionOf());
      const { root } = renderSection([['instagram', CreatorStatus.Approved, 'mertmutfakta']], {}, instagram);
      await act(async () => undefined);
      expect(textContent(root)).toEqual(expect.arrayContaining(['@mertmutfakta', ig().viaInstagram, ig().automations]));
      await press(button(root, ig().disconnect));
      expect(instagram.repo.disconnect).not.toHaveBeenCalled();
      const onConfirm: unknown = root.findByType(ConfirmSheet).props.onConfirm;
      if (typeof onConfirm !== 'function') throw new Error('no confirmation');
      await act(async () => onConfirm());
      expect(instagram.repo.disconnect).toHaveBeenCalled();
    });

    it('asks to reconnect once Instagram stopped accepting the link', async () => {
      const { root } = renderSection([['instagram', CreatorStatus.Approved, 'mertmutfakta']], {}, instagramStoreOf(connectionOf({ status: 'expired' })));
      await act(async () => undefined);
      expect(textContent(root)).toEqual(expect.arrayContaining([ig().reconnect]));
    });
  });
});
