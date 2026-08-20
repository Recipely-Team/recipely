import { ADSENSE_CLIENT_ID } from '@infrastructure/constants/ads';

/**
 * `adsbygoogle` is a push-only queue the loader script drains. It is the only
 * global this file touches, and declaring it here keeps the cast out of the
 * call site.
 */
declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

/** Resolves once the loader script is in the document, and only fetches it once. */
let script: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
  if (script !== null) return script;
  script = new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.async = true;
    tag.crossOrigin = 'anonymous';
    tag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    tag.onload = () => resolve();
    tag.onerror = () => {
      // Cleared so a later mount may try again: the usual cause is a content
      // blocker or a dropped request, neither of which is permanent.
      script = null;
      reject(new Error(tag.src));
    };
    document.head.appendChild(tag);
  });
  return script;
};

/**
 * Puts one AdSense display unit inside `host` and asks for an ad.
 *
 * @remarks
 * - **The unit is built here, not written as JSX.** `<ins>` is a DOM tag and
 *   this app's JSX is React Native's, which has no such element — so the node
 *   is created imperatively, the same way `AutoGrowTextInput` reaches for its
 *   textarea.
 * - **A fresh `<ins>` per mount, pushed exactly once.** `push({})` fills the
 *   next unfilled unit in the document; pushing twice for the same element
 *   throws ("already have ads in them"), and re-using an element across a route
 *   change would ask for an ad the previous page had already been given. The
 *   caller removes the node on unmount, which is what makes this hold in a
 *   single-page app where routes come and go without a reload.
 * - **The script is loaded here rather than in `+html.tsx`.** The shell wraps
 *   every route including `/login` and `/settings`; a loader there is what got
 *   recipely.net a policy notice (CLAUDE.md §23e). Loading it from the unit
 *   means it only ever runs on a page that has an ad to show.
 * - **An unfilled unit collapses on its own.** AdSense marks it
 *   `data-ad-status="unfilled"` and a `display: block` element with no content
 *   takes no height, so nothing here reserves space for an ad that never came.
 */
export const mountAdsenseUnit = async (host: HTMLElement, slotId: string): Promise<void> => {
  const unit = document.createElement('ins');
  unit.className = 'adsbygoogle';
  unit.style.display = 'block';
  unit.dataset.adClient = ADSENSE_CLIENT_ID;
  unit.dataset.adSlot = slotId;
  unit.dataset.adFormat = 'auto';
  unit.dataset.fullWidthResponsive = 'true';
  host.appendChild(unit);

  await loadScript();
  window.adsbygoogle = window.adsbygoogle ?? [];
  window.adsbygoogle.push({});
};
