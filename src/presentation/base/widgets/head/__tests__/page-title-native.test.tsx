import { create } from 'react-test-renderer';
import { PageTitle } from '@presentation/base/widgets/head/page-title';

/**
 * Reported from the App Store build: "Expo Head: Add the handoff origin to the
 * Expo Config" opened over onboarding, then again over login, then again — one
 * dialog per screen, because the root layout mounts the title on all of them.
 *
 * `expo-router/head` on iOS does not set a title at all: it registers an
 * `NSUserActivity` for Handoff, and with no `origin` in the config its
 * `throwOrAlert` prefers an `alert()` to a crash in a release build. So the
 * native half renders nothing, and must go on rendering nothing — mounting
 * `Head` here is what the user saw.
 */
it('renders nothing on a phone, so no Handoff activity is ever registered', () => {
  const tree = create(<PageTitle subject="Fırında Limonlu Tavuk" />);

  expect(tree.toJSON()).toBeNull();
});
