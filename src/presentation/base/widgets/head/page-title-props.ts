/**
 * What a page calls itself.
 *
 * Shared by the pair rather than written twice: the web half puts it in the
 * document's title, the native half has nowhere to put it.
 */
export interface PageTitleProps {
  /** The page's own name, or empty while it is still loading. */
  subject?: string;
}
