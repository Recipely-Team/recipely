import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@infrastructure/constants/api/api-hosts';

/**
 * Destinations that are pages on the web, not screens in the app.
 *
 * @remarks
 * - **Why they are separate from {@link ASSISTANT_NAVIGATION_TARGETS}.** The
 *   router cannot reach them; they open in a browser. Keeping them in the same
 *   table would have meant `router.navigate` being handed an `https://` URL,
 *   which is a different act with different consequences — it leaves the app.
 * - **Why they exist at all.** "Gizlilik politikasını aç" was answered
 *   "Gizlilik politikası sayfası bulunamadı" with the row visible on the
 *   settings screen the user was looking at. The page is not missing; the
 *   assistant simply had no word for it, and reported that as absence.
 */
export const ASSISTANT_EXTERNAL_TARGETS = {
  privacyPolicy: PRIVACY_POLICY_URL,
  privacy: PRIVACY_POLICY_URL,
  terms: TERMS_OF_USE_URL,
  termsOfUse: TERMS_OF_USE_URL,
} as const satisfies Readonly<Record<string, string>>;

/** A web page the assistant can open, by the name the model is given. */
export type AssistantExternalName = keyof typeof ASSISTANT_EXTERNAL_TARGETS;

/** Whether a spoken word names a page that lives outside the app. */
export const isAssistantExternalName = (name: string): name is AssistantExternalName =>
  Object.hasOwn(ASSISTANT_EXTERNAL_TARGETS, name);
