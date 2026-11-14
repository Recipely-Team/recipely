import { useCallback } from 'react';
import { CharConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { ALL_LOCALE_LIST } from '@application/i18n/supported-locales';
import { LANGUAGE_NAMES } from '@presentation/base/widgets/settings/language-names';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';

/** The language a spoken word names: its code (`de`) or its own name (`Deutsch`), any case. */
const localeFor = (said: string): string | null => {
  const word = said.trim().toLowerCase();
  return ALL_LOCALE_LIST.find((code) => code === word || (LANGUAGE_NAMES[code] ?? CharConstants.empty).toLowerCase() === word) ?? null;
};

/**
 * **"Show this in German"** on the create/edit screen — the language combo, by voice.
 *
 * @remarks
 * - **Same effect as picking in the combo**: the screen changes language, the
 *   app's saved language does not.
 * - **An unknown language is `unknown_language`**, never a silent fallback to English.
 */
export const useAssistantScreenLanguage = (onChange: (locale: string) => void): void => {
  useAssistantAction(
    AssistantAction.SetScreenLanguage,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const locale = localeFor(arg ?? CharConstants.empty);
        if (locale === null) return { ok: false, error: AssistantActionError.UnknownLanguage };
        onChange(locale);
        return { ok: true, title: LANGUAGE_NAMES[locale] ?? locale };
      },
      [onChange],
    ),
  );
};
