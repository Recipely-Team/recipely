/**
 * Opens Instagram's login and resolves with the return link it came back
 * with, or null when the user closed it. Shared by the native and web files.
 */
export type OpenInstagramLoginType = (loginUrl: string, returnUrl: string) => Promise<string | null>;
