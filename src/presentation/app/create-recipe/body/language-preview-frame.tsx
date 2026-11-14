import { useState, type ReactNode } from 'react';
import { LocalePreviewContext } from '@presentation/i18n/locale-preview-context';
import { useLocale } from '@presentation/i18n';
import { useAssistantScreenLanguage } from '@presentation/app/create-recipe/hooks/assistant/use-assistant-screen-language';
import { LanguagePreviewPicker } from '@presentation/app/create-recipe/body/language-preview-picker';

export interface LanguagePreviewFrameProps {
  children: ReactNode;
}

/**
 * Wraps the edit screen with its language combo box above it.
 *
 * @remarks
 * - **In every build.** The combo box is a product control on the edit screen.
 * - **Voice too**: `setScreenLanguage` sets the same value the combo does.
 * - **Null until someone picks.** Holding the app language from the start would
 *   freeze the screen on that language and ignore a later language change.
 */
export const LanguagePreviewFrame = ({ children }: LanguagePreviewFrameProps): React.JSX.Element => {
  const appLocale = useLocale();
  const [previewLocale, setPreviewLocale] = useState<string | null>(null);
  useAssistantScreenLanguage(setPreviewLocale);
  return (
    <LocalePreviewContext.Provider value={previewLocale}>
      <LanguagePreviewPicker value={previewLocale ?? appLocale} onChange={setPreviewLocale} />
      {children}
    </LocalePreviewContext.Provider>
  );
};
