import { Redirect } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

// The standalone AI screen has been folded into the unified create flow.
// Keep this route alive so existing deep links / pushes don't 404.
export default function AiGenerateRedirect(): React.JSX.Element {
  return <Redirect href={RoutePaths.createRecipe} />;
}
