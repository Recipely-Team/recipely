import { Redirect } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * `/settings` is kept only so old links and the web header's path still land
 * somewhere: every setting lives on Profile now (design spec → Navigation entry
 * points). Two copies of the same settings drifted apart — Profile had no
 * Reminders, Settings had no "Send feedback" — so there is one.
 */
export const SettingsRedirect = (): React.JSX.Element => <Redirect href={RoutePaths.profile} />;

export default SettingsRedirect;
