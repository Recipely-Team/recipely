import { machineLower } from '@presentation/base/hooks/assistant/args/machine-case';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/parse-key-value';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { SUPPORTED_LOCALE_LIST } from '@application/i18n/supported-locales';
import type { ThemePreference } from '@presentation/base/theme/context/theme-preference';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';

/** What settings lends the assistant, named where it is consumed. */
interface AssistantSettingsActionsDeps {
  onSetLanguage: (locale: string) => void;
  onSetThemePreference: (preference: ThemePreference) => void;
  onRequestSignOut: () => void;
}

const LANGUAGE = 'language';
const THEME = 'theme';
const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/**
 * Settings, by voice.
 *
 * @remarks
 * - **One word for every preference**, spelled `key=value`, matching how the
 *   assistant sets a draft field or a profile field. Separate actions per
 *   setting would be several words the model must choose between for what a
 *   user experiences as one kind of request.
 * - **The language list is the app's own offered list**, not one written here.
 *   A locale the app carries but does not offer — Arabic, which has no RTL
 *   layout yet — would leave the interface harder to read than before, and
 *   only `SUPPORTED_LOCALES` knows which those are.
 * - **Signing out asks.** It is not destructive, but it ends the session and
 *   everything behind it, and voice mishears — a one-syllable word most of all.
 */
export const useAssistantSettingsActions = (deps: AssistantSettingsActionsDeps): void => {
  const { onSetLanguage, onSetThemePreference, onRequestSignOut } = deps;

  useAssistantAction(
    AssistantAction.SetPreference,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseKeyValue(arg);
        if (parsed === null) return { ok: false, error: 'expected_key_equals_value' };

        const { key } = parsed;
        const value = machineLower(parsed.value);

        if (key === LANGUAGE) {
          if (!SUPPORTED_LOCALE_LIST.includes(value)) {
            return { ok: false, error: 'unknown_language' };
          }
          onSetLanguage(value);
          return { ok: true };
        }
        if (key === THEME) {
          const preference = THEME_PREFERENCES.find((p) => p === value);
          if (preference === undefined) return { ok: false, error: 'unknown_theme' };
          onSetThemePreference(preference);
          return { ok: true };
        }
        return { ok: false, error: 'unknown_preference' };
      },
      [onSetLanguage, onSetThemePreference],
    ),
  );

  useAssistantAction(
    AssistantAction.SignOut,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onRequestSignOut();
      return { ok: true, awaiting: true };
    }, [onRequestSignOut]),
  );
};
