import { machineLower } from '@presentation/base/hooks/assistant/args/resolving/machine-case';
import { resolveTaxonomyKey } from '@presentation/base/hooks/assistant/args/resolving/resolve-taxonomy-key';
import { ALL_THEMES, getThemeDefinition } from '@presentation/base/theme/colors/palette/themes';
import type { ThemeId } from '@presentation/base/theme/context/theme-id';
import { getLocale } from '@presentation/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';
import { parseKeyValue } from '@presentation/base/hooks/assistant/args/resolving/parse-key-value';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { SUPPORTED_LOCALE_LIST } from '@application/i18n/supported-locales';
import { LANGUAGE_NAMES } from '@presentation/base/widgets/settings/language-names';
import type { ThemePreference } from '@presentation/base/theme/context/theme-preference';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';

/** What settings lends the assistant, named where it is consumed. */
interface AssistantSettingsActionsDeps {
  /** The locale in force, so "hangi dildeyim" is answerable without guessing. */
  language: string;
  /** Light, dark or follow-the-system. */
  preference: ThemePreference;
  /** Which palette is selected, by id; the reading says the name on the swatch. */
  themeId: ThemeId;
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

/** What the reading calls the list of rows below the pickers. */
const ROWS_LABEL = 'rows';
/**
 * The rows this screen shows, in the order they are rendered.
 *
 * Named here rather than read off the render tree because the reading is built
 * outside it. They are the words the assistant offers when someone asks what
 * is on the settings screen — the two it cannot open are named as well, since
 * refusing a row it never mentioned is worse than mentioning it.
 */
const SETTINGS_ROWS: readonly string[] = [
  'appearance',
  'language',
  'signOut',
  'deleteAccount',
  'privacyPolicy',
  'termsOfUse',
];

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
  const { language, preference, themeId, onSetLanguage, onSetThemePreference, onSetThemeId, onRequestSignOut } =
    deps;

  // What the screen currently says, which the assistant could not read at all:
  // asked which language the app was in, or what the theme was set to, it had
  // only the route to go on and answered from the conversation instead.
  useAssistantScreenContent(() =>
    [`language=${language}`, `theme=${preference}`, `palette=${themeId}`].join(SCREEN_PART_SEPARATOR),
  );

  // The same three by the names they are shown under, plus what else is on the
  // screen. `readScreen` is the accessibility path: someone who cannot see the
  // rows still gets told what they are.
  useAssistantScreenReading(() =>
    [
      `language=${LANGUAGE_NAMES[language] ?? language}`,
      `theme=${preference}`,
      `palette=${paletteName(themeId)}`,
      listReading(ROWS_LABEL, SETTINGS_ROWS),
    ].join(SCREEN_PART_SEPARATOR),
  );

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
