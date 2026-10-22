import { CharConstants, UrlConstants } from '@core/constants';

/**
 * Addresses outside the app.
 *
 * @remarks
 * - **A builder, not a literal at the call site**, the same way `RoutePaths`
 *   treats in-app targets. `'https://instagram.com/' + handle` spelled where it
 *   is used is the magic value rule 5 forbids, and it is the spelling that
 *   quietly forks when a second screen needs the same link.
 * - **Share links encode what they carry**; callers pass plain text.
 */
export const instagramProfileUrl = (handle: string): string => `${UrlConstants.httpsScheme}instagram.com/${handle}`;

export const tiktokProfileUrl = (handle: string): string => `${UrlConstants.httpsScheme}www.tiktok.com/${CharConstants.at}${handle}`;

/** WhatsApp's own chat picker on phones, WhatsApp Web elsewhere. */
export const whatsappShareUrl = (text: string): string => `${UrlConstants.httpsScheme}wa.me/?text=${encodeURIComponent(text)}`;

export const smsShareUrl = (body: string): string => `sms:?body=${encodeURIComponent(body)}`;

export const mailtoShareUrl = (subject: string, body: string): string =>
  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
