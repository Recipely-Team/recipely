import { useState, type ReactNode } from 'react';
import { LocalePreviewContext } from '@presentation/i18n/locale-preview-context';
import { useLocale } from '@presentation/i18n';
import { DevLocalePicker } from '@presentation/base/widgets/dev/dev-locale-picker';

export interface LanguagePreviewFrameProps {
  children: ReactNode;
}

/**
 * Wraps a screen with a dev-only language preview above it.
 *
 * @remarks
 * - **Development builds only.** The picker and the preview value exist behind
 *   `__DEV__`; a release build passes `null`, so the screen follows the app's
 *   language exactly as before.
 * - **Null until someone picks.** Holding the app language from the start would
 *   freeze the screen on that language and ignore a later language change.
 */
export const LanguagePreviewFrame = ({ children }: LanguagePreviewFrameProps): React.JSX.Element => {
  const appLocale = useLocale();
  const [previewLocale, setPreviewLocale] = useState<string | null>(null);
  return (
    <LocalePreviewContext.Provider value={__DEV__ ? previewLocale : null}>
      {__DEV__ ? <DevLocalePicker value={previewLocale ?? appLocale} onChange={setPreviewLocale} /> : null}
      {children}
    </LocalePreviewContext.Provider>
  );
};
