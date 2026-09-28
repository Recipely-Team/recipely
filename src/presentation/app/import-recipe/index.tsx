import { useLocalSearchParams } from 'expo-router';
import { isString } from '@core/guards/type-guards';
import { ImportSource } from '@presentation/base/constants';
import { LinkImportFlow } from '@presentation/app/import-recipe/body/link-import-flow';
import { FileImportFlow } from '@presentation/app/import-recipe/body/file/file-import-flow';

/**
 * Turning something the user already has into a draft: a link, or the pages
 * of a written recipe.
 *
 * @remarks
 * - **One route, because it is one thing.** Arriving with `?importUrl=` (a
 *   share intent) queues straight away; arriving without one asks for a link;
 *   `?source=file` asks for photos or a PDF instead. Two routes would have
 *   meant two places that know what an import is, and a share that could land
 *   on the wrong one.
 * - **The two flows are separate components** so neither one's hooks run on
 *   the other's screen — the link import's assistant actions have nothing to
 *   do while pages are being picked.
 */
export const ImportRecipeScreen = (): React.JSX.Element => {
  const params = useLocalSearchParams<{ importUrl?: string; source?: string }>();
  if (params.source === ImportSource.File) return <FileImportFlow />;
  const importUrl = isString(params.importUrl) ? params.importUrl : undefined;
  return <LinkImportFlow importUrl={importUrl} />;
};

export default ImportRecipeScreen;
