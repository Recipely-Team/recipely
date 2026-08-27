import { machineLower } from '@presentation/base/hooks/assistant/args/machine-case';
import { resolveTaxonomyKey } from '@presentation/base/hooks/assistant/args/resolve-taxonomy-key';
import { ALL_THEMES, getThemeDefinition } from '@presentation/base/theme/colors/palette/themes';
import type { ThemeId } from '@presentation/base/theme/context/theme-id';
import { getLocale } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/parse-key-value';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { SUPPORTED_LOCALE_LIST } from '@application/i18n/supported-locales';
import { LANGUAGE_NAMES } from '@presentation/base/widgets/settings/language-names';
import type { ThemePreference } from '@presentation/base/theme/context/theme-preference';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';

/** What settings lends the assistant, named where it is consumed. */
interface AssistantSettingsActionsDeps {
  onSetLanguage: (locale: string) => void;
  onSetThemePreference: (preference: ThemePreference) => void;
  onSetThemeId: (themeId: ThemeId) => void;
  onRequestSignOut: () => void;
}

const LANGUAGE = 'language';
const THEME = 'theme';
/**
 * The colour palette, which is NOT `theme`.
 *
 * Light-or-dark and which palette are two different settings sitting under one
 * word in ordinary speech, and only one of them was wired: asked for "İnci
 * Beyazı" while its swatch was on screen, the assistant answered that no such
 * theme was in the list.
 */
const PALETTE = 'palette';
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
  const { onSetLanguage, onSetThemePreference, onSetThemeId, onRequestSignOut } = deps;

  useAssistantAction(
    AssistantAction.SetPreference,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseKeyValue(arg);
        if (parsed === null) return { ok: false, error: 'expected_key_equals_value' };

        const { key } = parsed;
        const value = machineLower(parsed.value);

        if (key === LANGUAGE) {
          // The code first, then the name the picker shows. "Almanca" reached
          // here as a word and was compared against `de` — so German, Spanish
          // and Russian were each refused as unavailable while all three are
          // selectable. The model is told to send a code; matching the endonym
          // as well means a spoken "Español" lands even when it does not.
          const locale = SUPPORTED_LOCALE_LIST.includes(value)
            ? value
            : resolveTaxonomyKey(
                SUPPORTED_LOCALE_LIST.map((code) => ({ key: code, name: LANGUAGE_NAMES[code] ?? code })),
                parsed.value,
              );
          if (locale === null || !SUPPORTED_LOCALE_LIST.includes(locale)) {
            return { ok: false, error: 'unknown_language' };
          }
          onSetLanguage(locale);
          return { ok: true };
        }
        if (key === PALETTE) {
          // Matched by NAME, through the same resolver the cuisine chips use:
          // the id is `pearl`, the swatch says "İnci Beyazı", and the user says
          // what the swatch says.
          const themeId = resolveTaxonomyKey(
            ALL_THEMES.map((id) => ({ key: id, name: paletteName(id) })),
            parsed.value,
          );
          if (themeId === null || !(ALL_THEMES as string[]).includes(themeId)) {
            return { ok: false, error: 'unknown_palette' };
          }
          onSetThemeId(themeId as ThemeId);
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
      [onSetLanguage, onSetThemePreference, onSetThemeId],
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

/** The palette's name in the language the user is reading, as the swatch shows it. */
function paletteName(id: ThemeId): string {
  const def = getThemeDefinition(id);
  return getLocale() === LocaleConstants.tr ? def.nameTr : def.name;
}
