/**
 * Destinations the assistant RECOGNISES but will not open, because they are not
 * in the app.
 *
 * @remarks
 * - **Recognised, so the refusal is honest.** "Gizlilik politikasını aç" was
 *   once answered "sayfa bulunamadı" with the row visible on the settings
 *   screen the user was looking at. The page is not missing. Naming it here is
 *   what lets the assistant say what is actually true: it cannot go there.
 * - **Not opened, because that leaves the app.** Sending someone into a browser
 *   is not a step back — it ends the voice session, drops the screen they were
 *   on, and the way back is the OS, not the assistant. That is a decision for
 *   the person holding the phone, and the row is right there for them to tap.
 * - **A list of names, not of URLs.** Nothing here needs a destination, which
 *   is the point: an assistant that held the URLs would eventually be asked to
 *   use them.
 */
export const ASSISTANT_EXTERNAL_NAMES: readonly string[] = [
  'privacyPolicy',
  'privacy',
  'terms',
  'termsOfUse',
];

/** Whether a spoken word names a page that lives outside the app. */
export const isAssistantExternalName = (name: string): boolean =>
  ASSISTANT_EXTERNAL_NAMES.includes(name);
